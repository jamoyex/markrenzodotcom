# Contextual quick replies

The guide and hero use the shared `getQuickReplies` helper. It selects up to three concise suggestions from the current AI response, recent conversation, a new reply from Mark, or the visitor's current page activity. The hero shows the first two.

## Context and focus

- A conversation response focuses suggestions on that exchange. New Telegram replies discard older model candidates and use the original question and Mark's answer.
- Browsing a section or project switches suggestions to that activity. A short navigation window preserves follow-ups while the guide performs its own navigation.
- The preview reports its brief, status, and cooldown. Editing a brief also updates suggestions while the guide is open; generated HTML is never sent as guide context.
- Repeated questions, completed navigation, and opening the current project are filtered. Generating previews and active cooldowns suppress suggestions to build another preview.

Page activity is processed locally and makes no extra provider requests. The next chat request includes bounded, allowlisted UI context as untrusted reference data. The model is instructed to propose relevant follow-ups, and the shared helper filters its candidates and supplies contextual fallbacks. Existing chat and preview rate limits remain in place.

## Verification

- Eleven pure quick-reply tests cover normalization, multilingual deduplication, semantic project-question deduplication, Mark replies, page focus, preview context, and cooldowns.
- Twenty pure agent tests pass, including injected-provider checks for context handling and suggestion filtering. These suites do not load environment files, access storage, or call a live provider.
- A live Courtfolio question returned an answer, opened the project, and supplied new follow-ups.
- The saved flower-shop preview showed ordering and launch suggestions without offering another build.
- The restored Sinigang reply showed personal follow-ups. At 375 × 667, the guide and wrapping chips fit without horizontal overflow.
- Production build, including TypeScript, passed.

Screenshots are in `artifacts/contextual-quick-replies.png` and `artifacts/contextual-quick-replies-mobile.png` (local verification artifacts).
