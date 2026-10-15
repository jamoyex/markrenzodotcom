"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  ArrowUpRight,
  ArrowRight,
  X,
  Plus,
  ChatCircle,
} from "@phosphor-icons/react";
import gsap from "gsap";
import LeadReview from "./LeadReview";
import GuideMarkdown from "./GuideMarkdown";
import { EMPTY_LEAD, readLead, type LeadDraft } from "@/lib/leads";
import type { SiteAction } from "@/lib/guide";
import { validateSiteAction } from "@/lib/site-actions";
import {
  getQuickReplies,
  normalizeGuideContext,
  type GuideContext,
} from "@/lib/quick-replies";
import {
  CHAT_STORAGE_KEY,
  WELCOME,
  freshChat,
  readChatArchive,
  saveChat,
  chatTitle,
  chatPreview,
  type ChatArchive,
  type SavedChat,
  type ChatMessage as Message,
  type ChatHandoff as Handoff,
  type ChatFailure as FailedQuestion,
} from "@/lib/chat-sessions";
import "./ai-guide.css";
import "./chat-history.css";
import "./guide-markdown.css";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readHandoff(value: unknown): Handoff | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !value.id ||
    value.id.length > 200
  )
    return null;
  if (
    value.status !== "sending" &&
    value.status !== "pending" &&
    value.status !== "answered" &&
    value.status !== "skipped" &&
    value.status !== "failed" &&
    value.status !== "expired"
  )
    return null;
  return {
    id: value.id,
    status: value.status,
    question: typeof value.question === "string" ? value.question : undefined,
    answer: typeof value.answer === "string" ? value.answer : undefined,
  };
}
/** One guide implementation for the homepage and every project story.
 * Session storage restores the active chat across full-page navigation. */
export default function useSiteGuide({
  context,
  onAction,
  ready = true,
}: {
  context: GuideContext;
  onAction: (action: SiteAction) => void;
  ready?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const guideContext = normalizeGuideContext(context);
  const guideInput = useRef<HTMLInputElement>(null);
  const guideOpener = useRef<HTMLElement | null>(null);
  const messageId = useRef(1);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const requestBusy = useRef(false);
  const chatRequest = useRef<AbortController | null>(null);
  const handoffRequest = useRef<AbortController | null>(null);
  const seenAnswers = useRef(new Set<string>());
  const guideVisible = useRef(false);
  const guideNavigationUntil = useRef(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const archive = useRef<ChatArchive | null>(null);
  const activeChat = useRef("");
  const knownHandoffs = useRef(new Set<string>());
  const mutedPollError = useRef(false);
  const [chatReady, setChatReady] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatList, setChatList] = useState<SavedChat[]>([]);
  const [historyUnavailable, setHistoryUnavailable] = useState(false);
  const [dismissedHandoffs, setDismissedHandoffs] = useState<string[]>([]);
  const [contactActive, setContactActive] = useState(false);
  const [leadDraft, setLeadDraft] = useState<LeadDraft | null>(null);
  const [leadRevision, setLeadRevision] = useState(0);
  const [leadSending, setLeadSending] = useState(false);
  const [leadError, setLeadError] = useState("");
  const leadRequestId = useRef<string | null>(null);
  const leadBusy = useRef(false);
  const pendingContact = useRef(false);
  const [leadPreview, setLeadPreview] = useState<string>();
  const contactDeepLink = useRef(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "guide",
      text: WELCOME,
    },
  ]);
  const [suggestedReplies, setSuggestedReplies] = useState<{
    items: string[];
    messageId: number;
  } | null>(null);
  const [suggestionFocus, setSuggestionFocus] = useState<
    "page" | "conversation"
  >("page");
  const [isAsking, setIsAsking] = useState(false);
  const [services, setServices] = useState<{
    ai: boolean;
  } | null>(null);
  const [guideMode, setGuideMode] = useState<"ai" | "fallback" | null>(null);
  const [failedQuestion, setFailedQuestion] = useState<FailedQuestion | null>(
    null,
  );
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [handoffError, setHandoffError] = useState("");
  const [unreadReplies, setUnreadReplies] = useState(0);

  function restoreChat(chat: SavedChat) {
    handoffRequest.current?.abort();
    handoffRequest.current = null;
    activeChat.current = chat.id;
    knownHandoffs.current = new Set(chat.handoffs.map((item) => item.id));
    seenAnswers.current = new Set(chat.seenAnswers);
    messageId.current =
      Math.max(...chat.messages.map((message) => message.id), 0) + 1;
    leadRequestId.current = chat.leadRequestId;
    mutedPollError.current = chat.pollErrorsMuted;
    setMessages(chat.messages);
    setHandoffs(chat.handoffs);
    setDismissedHandoffs(chat.dismissed);
    setQuestion(chat.question);
    setContactActive(chat.contactActive);
    setLeadDraft(chat.leadDraft);
    setLeadPreview(chat.leadPreview);
    setLeadRevision((value) => value + 1);
    setFailedQuestion(chat.failedQuestion);
    setGuideMode(
      chat.messages.findLast((message) => message.mode)?.mode || null,
    );
    setHandoffError("");
    setLeadError("");
    setUnreadReplies(0);
    setSuggestedReplies(null);
    setSuggestionFocus(
      guideContext.project
        ? "page"
        : chat.messages.length > 1
          ? "conversation"
          : "page",
    );
  }

  function persistChat() {
    if (!archive.current || !activeChat.current) return;
    const current: SavedChat = {
      id: activeChat.current,
      updatedAt: Date.now(),
      messages,
      handoffs,
      dismissed: dismissedHandoffs,
      pollErrorsMuted: mutedPollError.current,
      seenAnswers: [...seenAnswers.current],
      question,
      contactActive,
      leadDraft,
      leadPreview,
      leadRequestId: leadRequestId.current,
      failedQuestion,
    };
    archive.current = saveChat(archive.current, current, guideOpen);
    setChatList(archive.current.chats);
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(archive.current));
      setHistoryUnavailable(false);
    } catch {
      setHistoryUnavailable(true);
    }
  }

  useEffect(() => {
    let saved: ChatArchive | null = null;
    try {
      saved = readChatArchive(sessionStorage.getItem(CHAT_STORAGE_KEY));
    } catch {
      setHistoryUnavailable(true);
    }
    if (!saved) {
      const chat = { ...freshChat(crypto.randomUUID()), messages, handoffs };
      saved = { version: 1, activeId: chat.id, open: guideOpen, chats: [chat] };
    }
    archive.current = saved;
    restoreChat(saved.chats.find((chat) => chat.id === saved!.activeId)!);
    setChatList(saved.chats);
    setGuideOpen(saved.open);
    setChatReady(true);
    // Read storage once after hydration, before any persistence effect can write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatReady) persistChat();
    // The archive lives in a ref; saving must not retrigger itself through the history list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chatReady,
    messages,
    handoffs,
    dismissedHandoffs,
    handoffError,
    question,
    contactActive,
    leadDraft,
    leadPreview,
    failedQuestion,
    guideOpen,
    leadSending,
  ]);

  function selectChat(id: string) {
    if (!chatReady || requestBusy.current || leadBusy.current) return;
    persistChat();
    const target = archive.current?.chats.find((chat) => chat.id === id);
    if (!target) return;
    restoreChat(target);
    setHistoryOpen(false);
  }

  function newChat() {
    if (!chatReady || requestBusy.current || leadBusy.current) return;
    persistChat();
    // Reuse an untouched welcome instead of creating an empty pile of chats.
    const empty = archive.current?.chats.find(
      (chat) =>
        chat.messages.length === 1 &&
        !chat.question &&
        !chat.contactActive &&
        !chat.handoffs.length,
    );
    restoreChat(empty || freshChat(crypto.randomUUID()));
    setHistoryOpen(false);
    setGuideOpen(true);
  }

  const latestMessage = messages.at(-1);
  const suggestions = getQuickReplies({
    context: guideContext,
    focus: suggestionFocus,
    conversation: messages.slice(1).map((message) => ({
      role: message.role === "guide" ? ("assistant" as const) : message.role,
      content: message.text,
      question: message.question,
    })),
    candidates:
      suggestedReplies?.messageId === latestMessage?.id
        ? suggestedReplies?.items
        : undefined,
  });

  const mergeHandoffs = useCallback((updates: Handoff[]) => {
    if (!mounted.current || !updates.length) return;
    setHandoffs((previous) => {
      const next = new Map(previous.map((item) => [item.id, item]));
      updates.forEach((item) => {
        const previous = next.get(item.id);
        next.set(item.id, {
          ...previous,
          ...item,
          question: item.question ?? previous?.question,
          answer: item.answer ?? previous?.answer,
        });
      });
      return Array.from(next.values());
    });
    const replies: Message[] = [];
    for (const handoff of updates) {
      if (
        handoff.status !== "answered" ||
        !handoff.answer?.trim() ||
        seenAnswers.current.has(handoff.id)
      )
        continue;
      seenAnswers.current.add(handoff.id);
      replies.push({
        id: messageId.current++,
        role: "mark",
        text: handoff.answer,
        question: handoff.question,
      });
    }
    if (replies.length) {
      setMessages((previous) => [...previous, ...replies].slice(-40));
      setSuggestedReplies(null);
      setSuggestionFocus("conversation");
      if (!guideVisible.current)
        setUnreadReplies((count) => count + replies.length);
    }
  }, []);

  const checkHandoffs = useCallback(async () => {
    if (
      handoffRequest.current ||
      !activeChat.current ||
      !knownHandoffs.current.size
    )
      return;
    const conversation = activeChat.current;
    const controller = new AbortController();
    handoffRequest.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);
    try {
      const response = await fetch("/api/handoffs", {
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Handoff status unavailable");
      const data: unknown = await response.json();
      if (!isRecord(data) || !Array.isArray(data.handoffs))
        throw new Error("Invalid handoff response");
      if (
        !mounted.current ||
        controller.signal.aborted ||
        conversation !== activeChat.current
      )
        return;
      mergeHandoffs(
        data.handoffs
          .map(readHandoff)
          .filter(
            (item): item is Handoff =>
              item !== null && knownHandoffs.current.has(item.id),
          ),
      );
      setHandoffError("");
      mutedPollError.current = false;
    } catch {
      if (
        mounted.current &&
        conversation === activeChat.current &&
        !mutedPollError.current &&
        (!controller.signal.aborted || timedOut)
      )
        setHandoffError("I couldn’t load Mark’s reply. Please try again.");
    } finally {
      window.clearTimeout(timeout);
      if (handoffRequest.current === controller) handoffRequest.current = null;
    }
  }, [mergeHandoffs]);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void fetch("/api/chat/status", {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (
          mounted.current &&
          !controller.signal.aborted &&
          isRecord(data) &&
          typeof data.ai === "boolean"
        )
          setServices({ ai: data.ai });
      })
      .catch(() => {
        /* A question can still be tried if the status endpoint is unavailable. */
      });
    void checkHandoffs();
    return () => {
      mounted.current = false;
      controller.abort();
      chatRequest.current?.abort();
      handoffRequest.current?.abort();
      handoffRequest.current = null;
    };
  }, [checkHandoffs]);

  useEffect(() => {
    guideVisible.current = guideOpen;
    if (guideOpen) {
      setUnreadReplies(0);
      void checkHandoffs();
    }
  }, [guideOpen, checkHandoffs, chatReady, messages]);

  const pendingHandoffIds = handoffs
    .filter((item) => item.status === "pending" || item.status === "sending")
    .map((item) => item.id)
    .join("|");
  useEffect(() => {
    if (!pendingHandoffIds) return;
    const interval = window.setInterval(() => {
      void checkHandoffs();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [pendingHandoffIds, checkHandoffs]);

  useEffect(() => {
    if (
      !guideOpen ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const ctx = gsap.context(() => {
      gsap.from(".guide-panel", {
        y: 30,
        scale: 0.96,
        opacity: 0,
        transformOrigin: "right bottom",
        duration: 0.4,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });
    }, root);
    return () => ctx.revert();
  }, [guideOpen]);

  useEffect(() => {
    if (guideOpen)
      messagesEnd.current?.scrollIntoView({
        behavior: "instant",
        block: "nearest",
      });
  }, [messages, guideOpen, isAsking, leadRevision]);

  useEffect(() => {
    if (guideOpen && !historyOpen)
      guideInput.current?.focus({ preventScroll: true });
  }, [guideOpen, historyOpen]);

  function showGuide() {
    if (!guideOpen) guideOpener.current = document.activeElement as HTMLElement;
    setGuideOpen(true);
  }

  function closeGuide() {
    setGuideOpen(false);
    requestAnimationFrame(() =>
      guideOpener.current?.focus({ preventScroll: true }),
    );
  }

  async function sendLead() {
    if (!leadDraft || leadBusy.current || requestBusy.current) return;
    leadBusy.current = true;
    setLeadSending(true);
    setLeadError("");
    leadRequestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: leadDraft,
          requestId: leadRequestId.current,
          confirmed: true,
          previewPrompt: leadPreview,
        }),
        signal: AbortSignal.timeout(25000),
      });
      const result = await response.json();
      if (!response.ok || result.accepted !== true) {
        setLeadError(
          response.status === 429
            ? "You’ve sent a few ideas already. Please try again tomorrow."
            : response.status === 409
              ? "This brief was already submitted with different details. Start a new enquiry to send an update."
              : "I couldn’t confirm your brief was received. Please try again.",
        );
        return;
      }
      setMessages((previous) => [
        ...previous,
        {
          id: messageId.current++,
          role: "guide",
          text: "Thanks — your brief is in! Mark can follow up with you by email. Feel free to keep exploring while you’re here.",
        },
      ]);
      setContactActive(false);
      setLeadDraft(null);
      setSuggestedReplies(null);
    } catch {
      setLeadError(
        "I couldn’t confirm your brief was received. Please try again.",
      );
    } finally {
      leadBusy.current = false;
      setLeadSending(false);
    }
  }

  function startContact() {
    setHistoryOpen(false);
    if (requestBusy.current) {
      pendingContact.current = true;
      showGuide();
      return;
    }
    if (contactActive) {
      showGuide();
      return;
    }
    const prompt = guideContext.preview?.prompt;
    setContactActive(true);
    leadRequestId.current = null;
    setLeadError("");
    setLeadDraft(null);
    setLeadPreview(prompt);
    void ask(
      prompt
        ? "I’d like to talk to Mark about my preview idea. Help me put together a project brief."
        : "I’d like to talk to Mark about a project. Help me put together a brief.",
      undefined,
      true,
    );
  }

  useEffect(() => {
    if (
      !ready ||
      !chatReady ||
      contactDeepLink.current ||
      new URLSearchParams(window.location.search).get("enquire") !== "1"
    )
      return;
    contactDeepLink.current = true;
    startContact();
    const url = new URL(window.location.href);
    url.searchParams.delete("enquire");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    // A landing CTA is consumed once, after the welcome has finished.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, chatReady]);

  function performAction(action: SiteAction) {
    if (action.type === "navigate" && action.target === "contact") {
      startContact();
      return;
    }
    onAction(action);
  }

  async function ask(
    text: string,
    retry?: FailedQuestion,
    beginContact = false,
  ) {
    const clean = text.trim().slice(0, 2000);
    if (!clean || !chatReady || requestBusy.current || leadBusy.current) return;
    requestBusy.current = true;
    setIsAsking(true);
    setSuggestionFocus("conversation");
    setHistoryOpen(false);
    const requestId = retry?.requestId ?? crypto.randomUUID();
    setFailedQuestion({
      question: clean,
      requestId,
      error: "That reply was interrupted. You can retry your question.",
    });
    const controller = new AbortController();
    chatRequest.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 55000);
    if (!retry) {
      const userMessage: Message = {
        id: messageId.current++,
        role: "user",
        text: clean,
      };
      setMessages((previous) => [...previous, userMessage].slice(-40));
    }
    showGuide();
    setQuestion("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: clean,
          requestId,
          conversationId: activeChat.current,
          handoffIds: [...knownHandoffs.current].slice(-20),
          context: guideContext,
          contactMode: beginContact || contactActive,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? "Please give me a moment before asking another question."
            : "I couldn’t get a reply. Please try again in a moment.",
        );
      }
      const data: unknown = await response.json();
      if (
        !isRecord(data) ||
        typeof data.reply !== "string" ||
        !data.reply.trim() ||
        (data.mode !== "ai" && data.mode !== "fallback")
      ) {
        throw new Error(
          "That reply didn’t arrive correctly. Please try again.",
        );
      }
      if (!mounted.current || controller.signal.aborted) return;
      const reply: Message = {
        id: messageId.current++,
        role: "guide",
        text: data.reply,
        mode: data.mode,
      };
      // Commit and save the reply before an action can navigate to a project.
      flushSync(() => {
        setMessages((previous) => [...previous, reply].slice(-40));
        setGuideMode(reply.mode!);
        setFailedQuestion(null);
        const prepared = readLead(data.lead);
        if (prepared && (contactActive || beginContact)) {
          setLeadDraft(prepared);
          setLeadRevision((value) => value + 1);
        } else if (
          (contactActive || beginContact) &&
          data.mode === "fallback"
        ) {
          setLeadDraft({
            ...EMPTY_LEAD,
            brief: guideContext.preview?.prompt || "",
          });
          setLeadRevision((value) => value + 1);
        }
        const nextSuggestions = Array.isArray(data.suggestions)
          ? data.suggestions
              .filter(
                (item): item is string =>
                  typeof item === "string" &&
                  !!item.trim() &&
                  item.length <= 160,
              )
              .slice(0, 3)
          : [];
        setSuggestedReplies({ items: nextSuggestions, messageId: reply.id });
        const handoff = readHandoff(data.handoff);
        if (handoff) {
          knownHandoffs.current.add(handoff.id);
          mergeHandoffs([{ ...handoff, question: handoff.question ?? clean }]);
          void checkHandoffs();
        }
      });
      const actions = Array.isArray(data.actions)
        ? data.actions.filter(validateSiteAction).slice(0, 5)
        : [];
      guideNavigationUntil.current = Date.now() + 1600;
      actions.forEach(performAction);
      setSuggestionFocus("conversation");
    } catch (error) {
      if (!mounted.current || (controller.signal.aborted && !timedOut)) return;
      setFailedQuestion({
        question: clean,
        requestId,
        error: timedOut
          ? "This is taking a little longer than usual. Please try again."
          : error instanceof Error &&
              error.message.startsWith("Please give me a moment")
            ? error.message
            : "I couldn’t get a reply. Please try again in a moment.",
      });
    } finally {
      window.clearTimeout(timeout);
      if (chatRequest.current === controller) chatRequest.current = null;
      requestBusy.current = false;
      if (mounted.current) setIsAsking(false);
      if (mounted.current && pendingContact.current) {
        pendingContact.current = false;
        startContact();
      }
    }
  }

  const guideLabel = isAsking
    ? "Thinking…"
    : failedQuestion
      ? "Connection interrupted"
      : guideMode === "fallback"
        ? "AI unavailable · keep exploring"
        : guideMode === "ai" || services?.ai
          ? "AI guide · explore with me"
          : services
            ? "Site guide · explore with me"
            : "Site guide · ask away";
  const openHandoffs = handoffs.filter(
    (item) =>
      item.status !== "answered" && !dismissedHandoffs.includes(item.id),
  );

  const element = (
    <div className="site-guide" ref={root}>
      <button
        className={`guide-launcher ${guideOpen ? "launcher-hidden" : ""}`}
        aria-label="Open site guide"
        aria-expanded={guideOpen}
        onClick={showGuide}
      >
        <ChatCircle size={22} weight="fill" />
        <span>Ask me anything</span>
        {unreadReplies > 0 && (
          <span
            className="ai-unread"
            aria-label={`${unreadReplies} new ${unreadReplies === 1 ? "reply" : "replies"} from Mark`}
          >
            {unreadReplies}
          </span>
        )}
        <Plus size={18} />
      </button>
      {guideOpen && (
        <aside
          className="guide-panel ai-guide-panel"
          role="region"
          aria-label="Portfolio site guide"
        >
          <div className="guide-header">
            <div>
              <span className="guide-avatar">mr</span>
              <div>
                <strong>Explore with Mark’s AI</strong>
                <span>
                  <i /> {guideLabel}
                </span>
              </div>
            </div>
            <button
              className="icon-button"
              aria-label="Close site guide"
              onClick={closeGuide}
            >
              <X size={21} />
            </button>
          </div>
          <div className="chat-toolbar">
            <button
              type="button"
              aria-expanded={historyOpen}
              onClick={() => setHistoryOpen((value) => !value)}
              disabled={!chatReady}
            >
              {historyOpen ? "Back to chat" : "Your chats"}
              <span>
                {chatList.filter((chat) => chat.messages.length > 1).length ||
                  1}
              </span>
            </button>
            <button
              type="button"
              onClick={newChat}
              disabled={!chatReady || isAsking || leadSending}
            >
              <Plus size={14} /> New chat
            </button>
          </div>
          {historyOpen ? (
            <div className="chat-history" aria-label="Your conversations">
              <h3>A few good conversations.</h3>
              <p>Pick up where you left off. Saved for this browser session.</p>
              {historyUnavailable && (
                <p role="status">
                  This browser can’t save your chats right now. You can still
                  chat while this page is open.
                </p>
              )}
              <div className="chat-history-list">
                {chatList.map((chat) => (
                  <button
                    type="button"
                    key={chat.id}
                    onClick={() => selectChat(chat.id)}
                    disabled={isAsking || leadSending}
                    aria-current={
                      chat.id === activeChat.current ? "true" : undefined
                    }
                  >
                    <span className="chat-history-meta">
                      {chat.id === activeChat.current
                        ? "CURRENT CHAT"
                        : "CONVERSATION"}
                      <time dateTime={new Date(chat.updatedAt).toISOString()}>
                        {new Date(chat.updatedAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                    </span>
                    <strong>{chatTitle(chat)}</strong>
                    <span className="chat-history-preview">
                      {chatPreview(chat)}
                    </span>
                    <span className="chat-history-open">
                      Continue chatting <ArrowUpRight size={13} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div
                className="guide-messages"
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-label="Conversation with Mark’s site guide"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`guide-message message-${message.role}`}
                  >
                    <span>
                      {message.role === "mark"
                        ? "MARK"
                        : message.role === "guide"
                          ? message.mode === "fallback"
                            ? "SITE GUIDE"
                            : message.mode === "ai"
                              ? "AI GUIDE"
                              : "GUIDE"
                          : "YOU"}
                    </span>
                    {message.role === "mark" && message.question && (
                      <blockquote className="ai-reply-context">
                        {message.question}
                      </blockquote>
                    )}
                    {message.role === "user" ? (
                      <p>{message.text}</p>
                    ) : (
                      <GuideMarkdown
                        text={message.text}
                        onSiteAction={performAction}
                      />
                    )}
                  </div>
                ))}
                {isAsking && (
                  <div className="ai-thinking" role="status">
                    <span aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    One moment…
                  </div>
                )}
                {openHandoffs.map((handoff) => (
                  <div
                    className={`ai-handoff ai-handoff--${handoff.status}`}
                    key={handoff.id}
                  >
                    <button
                      type="button"
                      className="chat-dismiss"
                      aria-label={`Dismiss notice: ${handoff.question || "question for Mark"}`}
                      onClick={() =>
                        setDismissedHandoffs((previous) => [
                          ...previous,
                          handoff.id,
                        ])
                      }
                    >
                      <X size={15} />
                    </button>
                    <span className="ai-handoff-icon" aria-hidden="true">
                      {handoff.status === "pending" ||
                      handoff.status === "sending" ? (
                        <ChatCircle size={17} />
                      ) : (
                        <ArrowUpRight size={17} />
                      )}
                    </span>
                    <div>
                      <strong>
                        {handoff.status === "sending"
                          ? "Asking Mark…"
                          : handoff.status === "pending"
                            ? "Waiting for Mark"
                            : handoff.status === "expired"
                              ? "Still curious?"
                              : handoff.status === "skipped"
                                ? "Let’s try another question."
                                : "Couldn’t reach Mark just now."}
                      </strong>
                      {handoff.question && (
                        <p className="ai-handoff-question">
                          “{handoff.question}”
                        </p>
                      )}
                      <p>
                        {handoff.status === "sending"
                          ? "I’m getting in touch. You can keep exploring."
                          : handoff.status === "pending"
                            ? "His reply will appear here when he’s available. You can keep exploring."
                            : handoff.status === "expired"
                              ? "We didn’t hear back on this one. You can ask again or get in touch."
                              : handoff.status === "skipped"
                                ? "No answer on this one. Feel free to ask something else or get in touch."
                                : "Please try again later, or get in touch directly."}
                      </p>
                      {handoff.status !== "pending" &&
                        handoff.status !== "sending" && (
                          <button
                            type="button"
                            className="ai-inline-link"
                            onClick={startContact}
                          >
                            Contact Mark <ArrowUpRight size={12} />
                          </button>
                        )}
                    </div>
                  </div>
                ))}
                {handoffError && (
                  <div className="ai-check-error" role="status">
                    <button
                      type="button"
                      className="chat-dismiss"
                      aria-label="Dismiss reply connection notice"
                      onClick={() => {
                        mutedPollError.current = true;
                        setHandoffError("");
                      }}
                    >
                      <X size={15} />
                    </button>
                    <p>{handoffError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        mutedPollError.current = false;
                        void checkHandoffs();
                      }}
                    >
                      Check replies again
                    </button>
                  </div>
                )}
                {contactActive && leadDraft && (
                  <LeadReview
                    key={leadRevision}
                    draft={leadDraft}
                    previewPrompt={leadPreview}
                    onChange={setLeadDraft}
                    onSubmit={() => void sendLead()}
                    sending={leadSending || isAsking}
                    error={leadError}
                  />
                )}
                <div ref={messagesEnd} />
              </div>
              {failedQuestion && !isAsking && (
                <div className="ai-request-error" role="alert">
                  <button
                    type="button"
                    className="chat-dismiss"
                    aria-label="Dismiss message error"
                    onClick={() => setFailedQuestion(null)}
                  >
                    <X size={15} />
                  </button>
                  <p>{failedQuestion.error}</p>
                  <button
                    type="button"
                    disabled={isAsking}
                    onClick={() => {
                      void ask(failedQuestion.question, failedQuestion);
                    }}
                  >
                    Retry question <ArrowRight size={14} />
                  </button>
                </div>
              )}
              {contactActive && (
                <div className="lead-controls">
                  <button
                    type="button"
                    disabled={isAsking || leadSending}
                    onClick={() => {
                      setContactActive(false);
                      setLeadDraft(null);
                      setSuggestedReplies(null);
                      setMessages((previous) => [
                        ...previous,
                        {
                          id: messageId.current++,
                          role: "guide",
                          text: "Back to exploring. Your enquiry hasn’t been sent.",
                        },
                      ]);
                    }}
                  >
                    Back to exploring
                  </button>
                  {!leadDraft && (
                    <button
                      type="button"
                      disabled={isAsking}
                      onClick={() => {
                        setLeadDraft({
                          ...EMPTY_LEAD,
                          brief: leadPreview || "",
                        });
                        setLeadRevision((value) => value + 1);
                      }}
                    >
                      Add details directly
                    </button>
                  )}
                </div>
              )}
              {!contactActive && (
                <div
                  className="guide-suggestions"
                  role="group"
                  aria-label="Suggested next questions"
                  aria-busy={isAsking}
                >
                  {suggestions.map((text) => (
                    <button
                      key={text}
                      type="button"
                      disabled={isAsking}
                      onClick={() => {
                        void ask(text);
                      }}
                    >
                      {text}
                      <ArrowUpRight size={12} />
                    </button>
                  ))}
                </div>
              )}
              <form
                className="guide-reply-form"
                aria-busy={isAsking}
                onSubmit={(event) => {
                  event.preventDefault();
                  void ask(question);
                }}
              >
                <label className="sr-only" htmlFor="guide-question">
                  Your question
                </label>
                <input
                  ref={guideInput}
                  id="guide-question"
                  placeholder={
                    contactActive
                      ? "Tell me a little more…"
                      : "A project? An idea? Ask away."
                  }
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  maxLength={2000}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={
                    !chatReady || !question.trim() || isAsking || leadSending
                  }
                  aria-label={isAsking ? "Waiting for reply" : "Send question"}
                >
                  <ArrowRight size={20} />
                </button>
              </form>
            </>
          )}
        </aside>
      )}
    </div>
  );
  return {
    element,
    ask,
    startContact,
    guideLabel,
    isAsking,
    suggestions,
    guideVisible,
    guideNavigationUntil,
    setSuggestionFocus,
  };
}
