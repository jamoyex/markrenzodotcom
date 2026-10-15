"use client";

import { createContext, useContext, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkProjectLinks from "@/lib/remark-project-links";
import type { SiteAction } from "@/lib/guide";
import { resolveGuideLink } from "@/lib/guide-links";

const allowedElements = [
  "p",
  "a",
  "strong",
  "em",
  "del",
  "br",
  "hr",
  "blockquote",
  "ul",
  "ol",
  "li",
  "pre",
  "code",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

function ReplyHeading({ children }: { children?: ReactNode }) {
  return <h3 className="guide-markdown-heading">{children}</h3>;
}

const SiteActionContext = createContext<
  ((action: SiteAction) => void) | undefined
>(undefined);

function ReplyLink({
  href,
  children,
}: {
  href?: string;
  children?: ReactNode;
}) {
  const onSiteAction = useContext(SiteActionContext);
  const link = resolveGuideLink(href);
  if (!link) return <>{children}</>;
  if (link.kind === "site") {
    return (
      <a
        href={
          link.action.type === "project" ? `/work/${link.action.id}` : link.href
        }
        onClick={
          onSiteAction
            ? (event) => {
                if (
                  event.defaultPrevented ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                onSiteAction(link.action);
              }
            : undefined
        }
      >
        {children}
      </a>
    );
  }
  return (
    <a
      href={link.href}
      target={link.kind === "external" ? "_blank" : undefined}
      rel={link.kind === "external" ? "noopener noreferrer" : undefined}
      referrerPolicy="no-referrer"
    >
      {children}
      {link.kind === "external" && (
        <>
          <span className="guide-markdown-external" aria-hidden="true">
            ↗
          </span>
          <span className="sr-only"> (opens in a new tab)</span>
        </>
      )}
    </a>
  );
}

// Stable component identities preserve keyboard focus when the conversation updates.
const components: Components = {
  h1: ReplyHeading,
  h2: ReplyHeading,
  h3: ReplyHeading,
  h4: ReplyHeading,
  h5: ReplyHeading,
  h6: ReplyHeading,
  a: ReplyLink,
  pre: ({ children }) => (
    <pre tabIndex={0} aria-label="Code example">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div
      className="guide-markdown-table"
      role="region"
      aria-label="Table"
      tabIndex={0}
    >
      <table>{children}</table>
    </div>
  ),
};

export default function GuideMarkdown({
  text,
  onSiteAction,
}: {
  text: string;
  onSiteAction?: (action: SiteAction) => void;
}) {
  return (
    <SiteActionContext.Provider value={onSiteAction}>
      <div className="guide-markdown">
        <Markdown
          remarkPlugins={[remarkGfm, remarkProjectLinks]}
          skipHtml
          allowedElements={allowedElements}
          urlTransform={(url) => resolveGuideLink(url)?.href ?? ""}
          components={components}
        >
          {text}
        </Markdown>
      </div>
    </SiteActionContext.Provider>
  );
}
