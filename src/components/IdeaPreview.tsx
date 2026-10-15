"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkle,
  Camera,
  EnvelopeSimple,
  ChartBar,
  Desktop,
  DeviceMobile,
  Pause,
  Play,
  ArrowsOut,
  ArrowsIn,
  Check,
  Clock,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import type { GuideContext } from "@/lib/quick-replies";
import "./idea-preview.css";

type PreviewKind = "dashboard" | "automation" | "website";
type Props = {
  kind: PreviewKind;
  title?: string;
  runId?: number;
  onKindChange: (kind: PreviewKind) => void;
  onContact: () => void;
  onContextChange?: (context: NonNullable<GuideContext["preview"]>) => void;
};
type BuildState = {
  status: "empty" | "generating" | "ready" | "failed";
  preview?: { id: string; prompt: string; html: string; createdAt: string };
  nextAllowedAt?: string;
  error?: string;
};
const IDEAS = [
  {
    kind: "website",
    label: "Photography booking website",
    prompt:
      "Build a booking website for my photography studio. Include a portfolio gallery, session packages and a booking flow where visitors can pick a date and time. Use sample availability and make it warm, modern and easy to explore.",
    Icon: Camera,
  },
  {
    kind: "automation",
    label: "Email follow-up workflow",
    prompt:
      "Build me an email tracker automation. Show a visual workflow from an incoming email to categorizing it, following up and marking it done. Let me run a sample email through it.",
    Icon: EnvelopeSimple,
  },
  {
    kind: "dashboard",
    label: "Studio project dashboard",
    prompt:
      "Build me a dashboard for a small creative studio. Include project progress, monthly revenue, upcoming deadlines and filters I can try with sample data.",
    Icon: ChartBar,
  },
] as const;
const WORDS = [
  "A little structure.",
  "A little personality.",
  "Room for the unexpected.",
  "Your idea is taking shape.",
];

function BuildAnimation({
  active,
  paused,
  onPause,
}: {
  active: boolean;
  paused: boolean;
  onPause: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!active || paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setLine((value) => (value + 1) % WORDS.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [active, paused]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(element);
    const visibility = () =>
      setVisible(
        !document.hidden && element.getBoundingClientRect().bottom > 0,
      );
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  function nudge() {
    if (
      !root.current ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    gsap.fromTo(
      root.current.querySelectorAll(".ip-flying-inner"),
      { scale: 0.94 },
      {
        scale: 1,
        rotation: "+=12",
        duration: 0.6,
        ease: "back.out(1.4)",
        stagger: 0.035,
        overwrite: true,
      },
    );
  }
  return (
    <div
      ref={root}
      className={`ip-imagination${active ? " is-building" : ""}`}
      data-paused={paused || !visible}
    >
      <div className="ip-flight-field" aria-hidden="true">
        <span className="ip-flying ip-flying-one">
          <span className="ip-flying-inner ip-speech">what if?</span>
        </span>
        <span className="ip-flying ip-flying-two">
          <span className="ip-flying-inner ip-camera">
            <Camera weight="fill" />
          </span>
        </span>
        <span className="ip-flying ip-flying-three">
          <span className="ip-flying-inner ip-mini-window">
            <i />
            <i />
            <i />
            <b>hello, idea.</b>
            <em />
          </span>
        </span>
        <span className="ip-flying ip-flying-four">
          <span className="ip-flying-inner ip-mail">
            <EnvelopeSimple weight="duotone" />
          </span>
        </span>
        <span className="ip-flying ip-flying-five">
          <span className="ip-flying-inner ip-star">✳</span>
        </span>
        <span className="ip-flying ip-flying-six">
          <span className="ip-flying-inner ip-code">&lt;/&gt;</span>
        </span>
        <span className="ip-flying ip-flying-seven">
          <span className="ip-flying-inner ip-speech ip-yes">
            make it
            <br />
            happen.
          </span>
        </span>
        <span className="ip-flying ip-flying-eight">
          <span className="ip-flying-inner ip-pixel">↗</span>
        </span>
        {active &&
          [0, 1, 2, 3, 4, 5].map((index) => (
            <span key={index} className={`ip-confetti ip-confetti-${index}`}>
              <span>{index % 2 ? "+" : "✦"}</span>
            </span>
          ))}
        <div className="ip-orb" />
        <div className="ip-orbit-line" />
      </div>
      <div className="ip-imagination-copy">
        <span className="ip-eyebrow">
          {active ? "A GOOD IDEA IS IN MOTION" : "FROM A LITTLE “WHAT IF”"}
        </span>
        <h3>
          {active ? (
            <>
              Making
              <br />
              <span>something yours.</span>
            </>
          ) : (
            <>
              You imagine it.
              <br />
              <span>Let’s see it.</span>
            </>
          )}
        </h3>
        <p>
          {active
            ? WORDS[line]
            : "A website. A workflow. A better way to do your day."}
        </p>
        {active && (
          <button type="button" className="ip-nudge" onClick={nudge}>
            Give it a little nudge <Sparkle aria-hidden="true" />
          </button>
        )}
      </div>
      <button
        type="button"
        className="ip-motion-control"
        aria-pressed={paused}
        onClick={onPause}
        aria-label={
          paused ? "Resume preview animation" : "Pause preview animation"
        }
      >
        {paused ? <Play /> : <Pause />} <span>{paused ? "Play" : "Pause"}</span>
      </button>
    </div>
  );
}

export default function IdeaPreview({
  kind,
  title,
  runId,
  onKindChange,
  onContact,
  onContextChange,
}: Props) {
  const id = useId();
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<BuildState>({ status: "empty" });
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now);
  const [mobile, setMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [drafting, setDrafting] = useState(false);
  const draftingRef = useRef(false);
  draftingRef.current = drafting;
  const root = useRef<HTMLDivElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const errorMessage = useRef<HTMLDivElement>(null);
  const animateTransition = useRef(false);
  const focusDestination = useRef<"summary" | "editor" | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const alive = useRef(true);
  const requestId = useRef<string | null>(null);
  const busyRef = useRef(false);
  const handledRun = useRef(runId ?? 0);
  const busy = sending || state.status === "generating";
  const remaining = Math.max(
    0,
    (state.nextAllowedAt ? Date.parse(state.nextAllowedAt) : 0) - now,
  );
  const locked = remaining > 0;
  const totalMinutes = Math.max(1, Math.ceil(remaining / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const waitLabel = hours
    ? `${hours}h${minutes ? ` ${minutes}m` : ""}`
    : `${minutes}m`;
  const canBuild = loaded && !busy && !locked && prompt.trim().length >= 12;
  const showCanvas = busy || Boolean(state.preview && !drafting);
  const compact = showCanvas;
  // An older saved preview may coexist with a newer pending/failed attempt.
  // Its brief belongs to that saved canvas, never to the in-flight build.
  const displayedPrompt = busy
    ? submittedPrompt || "Your idea is taking shape."
    : state.preview?.prompt || prompt;

  useLayoutEffect(() => {
    const composer = editor.current;
    if (!composer) return;
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const shouldAnimate = animateTransition.current;
    animateTransition.current = false;
    const finish = () => {
      gsap.set(composer, {
        height: compact ? 0 : "auto",
        overflow: compact ? "hidden" : "visible",
        clearProps: "transform",
      });
      if (summary.current)
        gsap.set(summary.current, { height: "auto", overflow: "visible" });
    };
    const timeline = gsap.timeline({ onComplete: finish });

    if (!shouldAnimate || reduce) {
      gsap.set(composer, {
        height: compact ? 0 : "auto",
        autoAlpha: compact ? 0 : 1,
        y: 0,
      });
      // Keep only a brief fade when visitors prefer reduced motion.
      if (shouldAnimate && canvas.current) {
        timeline.fromTo(
          canvas.current,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.15,
            ease: "power3.out",
            clearProps: "opacity",
          },
        );
      } else finish();
    } else {
      // This is an accordion: measured height lets the prompt physically retract.
      // All canvas/summary entrance motion uses transforms and opacity.
      const currentHeight = composer.getBoundingClientRect().height;
      gsap.set(composer, {
        height: currentHeight,
        visibility: "visible",
        overflow: "hidden",
      });
      timeline.to(
        composer,
        {
          height: compact ? 0 : composer.scrollHeight,
          autoAlpha: compact ? 0 : 1,
          y: compact ? -8 : 0,
          duration: 0.24,
          ease: "power3.out",
        },
        0,
      );
      if (summary.current) {
        const summaryHeight = summary.current.scrollHeight;
        timeline.fromTo(
          summary.current,
          { height: 0, opacity: 0, y: 8, overflow: "hidden" },
          {
            height: summaryHeight,
            opacity: 1,
            y: 0,
            duration: 0.24,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
          0.06,
        );
      }
      if (canvas.current) {
        timeline.fromTo(
          canvas.current,
          { opacity: 0, y: 24, scale: 0.985 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.28,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
          0.12,
        );
        if (
          focusDestination.current === "summary" &&
          root.current &&
          canvas.current.getBoundingClientRect().bottom > window.innerHeight
        ) {
          // Bring the submitted idea and emerging canvas into view together.
          // Manual scrolling interrupts this move; completion never scrolls again.
          timeline.to(
            window,
            {
              scrollTo: { y: root.current, offsetY: 24, autoKill: true },
              duration: 0.28,
              ease: "power3.out",
            },
            0.12,
          );
        }
      }
    }
    if (focusDestination.current === "summary") {
      summary.current?.focus({ preventScroll: true });
    } else if (focusDestination.current === "editor") {
      const target = textarea.current?.disabled
        ? errorMessage.current
        : textarea.current;
      target?.focus({ preventScroll: true });
    }
    focusDestination.current = null;
    return () => {
      timeline.kill();
    };
  }, [compact]);

  useEffect(() => {
    if (!root.current) return;
    // Refresh after the accordion settles and when loading becomes the iframe.
    // This also covers responsive wrapping and the expanded preview controls.
    let timer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 80);
    });
    observer.observe(root.current);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    // Only the brief and lifecycle are shared with the guide, never generated HTML.
    const timer = window.setTimeout(
      () =>
        onContextChange?.({
          status: busy
            ? "generating"
            : !locked && drafting
              ? "empty"
              : state.status,
          prompt: (busy
            ? submittedPrompt
            : compact
              ? state.preview?.prompt || ""
              : prompt
          )
            .trim()
            .slice(0, 1200),
          nextAllowedAt: locked ? state.nextAllowedAt : undefined,
        }),
      busy ? 0 : 250,
    );
    return () => window.clearTimeout(timer);
  }, [
    loaded,
    busy,
    state.status,
    state.preview?.prompt,
    state.nextAllowedAt,
    prompt,
    locked,
    compact,
    drafting,
    submittedPrompt,
    onContextChange,
  ]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/preview", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok)
        throw new Error(
          "Your preview couldn’t be loaded. Try again in a moment.",
        );
      const data: BuildState = await response.json();
      if (!alive.current) return;
      setState(data);
      setLoaded(true);
      setError("");
      setNow(Date.now());
      if (data.preview && data.status !== "generating" && !draftingRef.current)
        setPrompt((current) => current || data.preview!.prompt);
      return data;
    } catch (failure) {
      if (alive.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "Your preview couldn’t be loaded.",
        );
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void refresh();
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    const onFocus = () => {
      if (!busyRef.current) void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      alive.current = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);
  useEffect(() => {
    if (state.status !== "generating" || sending) return;
    const timer = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [state.status, sending, refresh]);
  useEffect(() => {
    if (!runId || runId === handledRun.current) return;
    handledRun.current = runId;
    if (busy || locked) return;
    animateTransition.current = true;
    focusDestination.current = "editor";
    setDrafting(true);
    const idea = IDEAS.find((item) => item.kind === kind)!;
    setPrompt(
      title?.trim()
        ? `Build me ${title.trim()}. Create a ${kind} preview with a distinctive visual style and useful interactions.`
        : idea.prompt,
    );
    textarea.current?.focus({ preventScroll: true });
  }, [runId, title, kind, busy, locked]);

  async function build(event: React.FormEvent) {
    event.preventDefault();
    if (!canBuild || busyRef.current) return;
    busyRef.current = true;
    animateTransition.current = true;
    focusDestination.current = "summary";
    setSubmittedPrompt(prompt.trim());
    setDrafting(false);
    setSending(true);
    setError("");
    setExpanded(false);
    requestId.current ??= crypto.randomUUID();
    try {
      const send = () =>
        fetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            prompt: prompt.trim(),
            requestId: requestId.current,
          }),
        });
      let response = await send();
      // A missing/expired session is bootstrapped without spending a build.
      if (response.status === 428) response = await send();
      const data: BuildState = await response.json();
      if (!alive.current) return;
      if (data.status) {
        setState(data);
        setNow(Date.now());
        if (data.status === "failed" && !data.preview)
          focusDestination.current = "editor";
      }
      if (!response.ok) {
        // A rejected request never replaces the visitor's editable brief.
        // Keep a saved preview available without presenting it as a new result.
        if (data.status !== "generating") {
          animateTransition.current = true;
          focusDestination.current = "editor";
          setDrafting(true);
        }
        setError(
          data.error ||
            "That idea couldn’t take shape just yet. Please try again shortly.",
        );
        if (!data.nextAllowedAt && response.status < 500)
          requestId.current = null;
      } else requestId.current = null;
    } catch {
      if (alive.current) {
        setError("The connection slipped. Checking on your idea…");
        const recovered = await refresh();
        if (!alive.current) return;
        const recoveredNewPreview =
          recovered?.status === "ready" &&
          recovered.preview?.id !== state.preview?.id &&
          recovered.preview?.prompt === prompt.trim();
        if (recovered?.status !== "generating" && !recoveredNewPreview) {
          setDrafting(true);
          focusDestination.current = "editor";
          setError(
            recovered?.status === "failed"
              ? recovered.error || "This idea couldn’t be finished this time."
              : "The connection slipped. Your idea is still here. Try again in a moment.",
          );
        }
      }
    } finally {
      busyRef.current = false;
      if (alive.current) {
        animateTransition.current = true;
        setSending(false);
      }
    }
  }

  return (
    <div
      ref={root}
      className="ip-root"
      data-view={compact ? "canvas" : "prompt"}
    >
      <div className={`ip-composer${compact ? " is-compact" : ""}`}>
        <div className="ip-composer-heading">
          <span className="ip-eyebrow">
            {compact ? "YOUR IDEA" : "YOUR IDEA, FIRST"}
          </span>
          <span className="ip-allowance">
            <Clock size={14} />{" "}
            {locked
              ? `Next idea in ${waitLabel}`
              : "One fresh idea every 24 hours"}
          </span>
        </div>
        {compact && (
          <div
            ref={summary}
            className="ip-prompt-summary"
            tabIndex={-1}
            role="group"
            aria-label="Your idea"
          >
            <p className="ip-submitted-prompt">{displayedPrompt}</p>
            <div className="ip-summary-bottom">
              <span className="ip-summary-status">
                {busy ? <Sparkle size={15} /> : <Check size={15} />}
                {busy
                  ? "Making it happen"
                  : state.status === "failed"
                    ? "Your previous preview"
                    : "Saved for you"}
              </span>
              {!busy && !locked && (
                <button
                  type="button"
                  className="ip-new-idea"
                  onClick={() => {
                    animateTransition.current = true;
                    focusDestination.current = "editor";
                    setDrafting(true);
                    setPrompt("");
                    setError("");
                    requestId.current = null;
                  }}
                >
                  Try a new idea <ArrowUpRight size={15} />
                </button>
              )}
            </div>
          </div>
        )}
        <div
          ref={editor}
          className="ip-composer-editor"
          inert={compact}
          aria-hidden={compact}
        >
          <form onSubmit={build}>
            <label htmlFor={`${id}-prompt`}>
              Describe the app, website or tool you want for your business.
            </label>
            <textarea
              ref={textarea}
              id={`${id}-prompt`}
              rows={3}
              maxLength={1200}
              minLength={12}
              value={prompt}
              disabled={busy || locked || !loaded}
              onChange={(event) => {
                setPrompt(event.target.value);
                requestId.current = null;
              }}
              placeholder="Build a booking website for my photography studio…"
              aria-describedby={`${id}-help`}
            />
            <div className="ip-composer-bottom">
              <p id={`${id}-help`}>
                {busy
                  ? "Stay curious. Your preview is on its way."
                  : locked
                    ? "Your idea stays here. Come back tomorrow with another."
                    : "Who is it for? What should it do? How should it feel?"}
              </p>
              <button
                className="ip-build-button"
                disabled={!canBuild}
                type="submit"
              >
                {busy
                  ? "Making your preview…"
                  : locked
                    ? "See you tomorrow"
                    : "Make it happen"}
                <ArrowUpRight size={20} />
              </button>
            </div>
          </form>
          <div className="ip-suggestions" aria-label="Ideas to start with">
            <span>Or start here</span>
            {IDEAS.map(({ kind: option, label, prompt: suggestion, Icon }) => (
              <button
                type="button"
                key={option}
                disabled={busy || locked || !loaded}
                onClick={() => {
                  setPrompt(suggestion);
                  onKindChange(option);
                  requestId.current = null;
                  textarea.current?.focus({ preventScroll: true });
                }}
              >
                <Icon size={17} />
                {label}
                <ArrowUpRight size={13} />
              </button>
            ))}
          </div>
          {drafting && state.preview && !busy && (
            <button
              type="button"
              className="ip-saved-idea"
              onClick={() => {
                animateTransition.current = true;
                focusDestination.current = "summary";
                setDrafting(false);
                setError("");
              }}
            >
              View your saved preview <ArrowRight size={15} />
            </button>
          )}
        </div>
        {error && (
          <div
            ref={errorMessage}
            className="ip-error"
            role="alert"
            tabIndex={-1}
          >
            {error}
            {!loaded && (
              <button type="button" onClick={() => void refresh()}>
                Try again
              </button>
            )}
          </div>
        )}
        {!busy && state.status === "failed" && !error && (
          <div
            ref={errorMessage}
            className="ip-error"
            role="alert"
            tabIndex={-1}
          >
            {state.error ||
              "This idea didn’t come together this time. You can try a new one tomorrow."}
          </div>
        )}
      </div>

      {showCanvas && (
        <div
          ref={canvas}
          className={`ip-frame${expanded ? " ip-expanded" : ""}`}
          aria-busy={busy}
        >
          <div className="ip-browser-bar">
            <span className="ip-browser-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="ip-browser-title">
              {busy
                ? "a little possibility, in progress"
                : state.preview
                  ? "your idea, made visible"
                  : "a blank canvas. all yours."}
            </span>
            <span className="ip-demo-label">Interactive demo</span>
          </div>
          {busy ? (
            <BuildAnimation
              active={busy}
              paused={paused}
              onPause={() => setPaused((value) => !value)}
            />
          ) : state.preview ? (
            <>
              <div className="ip-preview-toolbar">
                <span>
                  <Check size={14} /> Saved for you
                </span>
                <div role="group" aria-label="Preview size">
                  <button
                    type="button"
                    aria-label="Desktop preview"
                    aria-pressed={!mobile}
                    onClick={() => setMobile(false)}
                  >
                    <Desktop size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label="Mobile preview"
                    aria-pressed={mobile}
                    onClick={() => setMobile(true)}
                  >
                    <DeviceMobile size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label={expanded ? "Reduce preview" : "Expand preview"}
                    aria-pressed={expanded}
                    onClick={() => setExpanded((value) => !value)}
                  >
                    {expanded ? (
                      <ArrowsIn size={18} />
                    ) : (
                      <ArrowsOut size={18} />
                    )}
                  </button>
                </div>
              </div>
              <div
                className={`ip-preview-stage${mobile ? " ip-mobile-preview" : ""}`}
              >
                <iframe
                  key={state.preview.id}
                  title="Your generated interactive preview"
                  src={`/api/preview/document?id=${encodeURIComponent(state.preview.id)}`}
                  sandbox="allow-scripts"
                  referrerPolicy="no-referrer"
                  allow="camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'; clipboard-read 'none'; clipboard-write 'none'"
                />
              </div>
            </>
          ) : null}
          <div className="ip-footer">
            <p>
              {state.preview && !busy
                ? "This is the starting point. Let’s build the version your business can use."
                : "Start with a spark. I’ll help you take it further."}
            </p>
            <button type="button" onClick={onContact}>
              Let’s make it real <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
      <span className="ip-sr-only" role="status">
        {busy
          ? "Your preview is taking shape. You can explore the rest of the page while you wait."
          : state.preview
            ? "Your preview is ready and saved for this browser."
            : ""}
      </span>
    </div>
  );
}
