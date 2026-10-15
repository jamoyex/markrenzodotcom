# Browser-session chat history and dismissible notices

Implemented October 15, 2026.

- The guide saves up to 12 conversations in this tab's sessionStorage. Reloads and same-tab navigation preserve messages, unsent text, contact drafts, request identity and dismissed notices. Browser storage is validated and bounded; a storage failure leaves the current conversation usable.
- Your chats provides conversation titles and last-message previews. New chat creates independent model context while keeping previous chats available. An untouched welcome chat is reused.
- New conversations do not reset visitor rate limits or the preview generation allowance. Server history and request replay are scoped by a hash of the visitor cookie identity plus the conversation UUID.
- Handoff polling only displays IDs attached to the active conversation. Switching chats aborts its poll; stale responses cannot update the newly selected chat. Owner answers are deduplicated and may still arrive after a waiting notice is dismissed.
- Handoff notices, reply-check failures and failed chat requests have accessible close controls. Dismissed handoff IDs persist with that conversation. Request errors can be retried with their original ID, including after interrupted page loads; restoration never automatically resubmits a request or replays site actions.
- Previously lost client messages cannot be recovered by this change. Retention begins when this version is loaded. Session storage follows the browser's tab/session lifecycle.

Validation: TypeScript passes; 17 focused tests pass, covering Markdown links, storage validation/limits and conversation/request separation. The only database test explicitly allocates a fresh OS temporary directory before importing the lazy store module and injects that path; it never calls getStore or loads environment files. Browser checks used the actual frontend with offline API fixtures: dismissal survives refresh, new chats are independent, history previews restore an older conversation and draft, and mobile layout/close controls work. No live OpenAI, Telegram or database operations were used for QA.

## Shared guide on project pages

The homepage and ProjectStory now use `useSiteGuide`, sharing the complete guide UI, conversation persistence, error dismissal, Markdown links and lead flow. Each project supplies its own context for relevant quick replies. Project CTAs start the lead conversation in place; guide section links navigate back to the corresponding homepage section. Launcher styling is scoped to the shared guide wrapper so it looks the same on every page.

Browser QA followed an answer link from home to PicklePals, continued chatting there, navigated to SelfHelp AI, and returned home. Messages and an unsent draft survived navigation, and fixture logs confirmed the same conversation UUID across home and both project pages. New chat, history and the inline project enquiry CTA were verified, including mobile history layout. TypeScript and 28 focused tests passed. All browser requests were offline fixtures; no live database or external AI/Telegram calls were used.
