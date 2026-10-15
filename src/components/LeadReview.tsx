"use client";

import type { LeadDraft } from "@/lib/leads";
import "./lead-review.css";

export default function LeadReview({
  draft: details,
  previewPrompt,
  onChange: setDetails,
  onSubmit,
  sending,
  error,
}: {
  draft: LeadDraft;
  previewPrompt?: string;
  onChange: (draft: LeadDraft) => void;
  onSubmit: () => void;
  sending: boolean;
  error: string;
}) {
  return (
    <form
      className="lead-review"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      aria-label="Review your project enquiry"
      aria-busy={sending}
    >
      <span className="lead-eyebrow">YOUR NEXT BIG WHAT IF</span>
      <h3>A little brief. A good start.</h3>
      <p>Check the details, then send your idea to Mark.</p>
      <fieldset disabled={sending}>
        <label>
          Your name
          <input
            required
            autoComplete="name"
            maxLength={100}
            value={details.name}
            onChange={(e) => setDetails({ ...details, name: e.target.value })}
          />
        </label>
        <label>
          Email to reply to
          <input
            required
            type="email"
            autoComplete="email"
            maxLength={254}
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
          />
        </label>
        <label>
          What would you like to build?
          <textarea
            required
            minLength={10}
            maxLength={1200}
            rows={4}
            value={details.brief}
            onChange={(e) =>
              setDetails({
                ...details,
                brief: e.target.value.replace(/[\r\n]+/g, " "),
              })
            }
          />
        </label>
        <div className="lead-optional">
          <label>
            Budget <small>optional</small>
            <input
              maxLength={120}
              value={details.budget}
              onChange={(e) =>
                setDetails({ ...details, budget: e.target.value })
              }
              placeholder="Still exploring"
            />
          </label>
          <label>
            Timing <small>optional</small>
            <input
              maxLength={120}
              value={details.timeline}
              onChange={(e) =>
                setDetails({ ...details, timeline: e.target.value })
              }
              placeholder="No rush yet"
            />
          </label>
        </div>
        {previewPrompt && (
          <details>
            <summary>Your preview idea is included</summary>
            <p>{previewPrompt}</p>
          </details>
        )}
        <p className="lead-send-note">
          Send these details to Mark so he can reply to your email.
        </p>
        <button className="lead-send" type="submit">
          {sending ? "Sending your idea…" : "Send to Mark ↗"}
        </button>
      </fieldset>
      {error && (
        <p role="alert" className="lead-error">
          {error}
        </p>
      )}
    </form>
  );
}
