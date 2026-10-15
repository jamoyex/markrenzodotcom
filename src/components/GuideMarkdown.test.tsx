import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import GuideMarkdown from "./GuideMarkdown";
import { resolveGuideLink } from "../lib/guide-links";
import { PROJECT_IDS } from "../lib/project-ids";

const render = (text: string) =>
  renderToStaticMarkup(<GuideMarkdown text={text} onSiteAction={() => {}} />);

test("renders emphasis, headings and lists instead of Markdown punctuation", () => {
  const html = render(
    "## Mark’s projects\n\n**Courtfolio** is for *pickleball players*.\n\n- Find courts\n- Save sessions",
  );
  assert.match(html, /<h3[^>]*>Mark’s projects<\/h3>/);
  assert.match(
    html,
    /<strong><a href="\/work\/courtfolio">Courtfolio<\/a><\/strong>/,
  );
  assert.match(html, /<em>pickleball players<\/em>/);
  assert.match(
    html,
    /<ul>\s*<li>Find courts<\/li>\s*<li>Save sessions<\/li>\s*<\/ul>/,
  );
  assert.doesNotMatch(html, /\*\*Courtfolio\*\*/);
});

test("renders section links, project story anchors, and safe external links", () => {
  const html = render(
    "[Skills](#skills) · [Courtfolio](#project/courtfolio) · [Visit Courtfolio](https://courtfolio.app)",
  );
  assert.match(html, /<a href="#skills">Skills<\/a>/);
  assert.match(html, /<a href="\/work\/courtfolio">Courtfolio<\/a>/);
  assert.match(
    html,
    /href="https:\/\/courtfolio.app\/" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"/,
  );
  assert.match(html, /opens in a new tab/);
});

test("maps only validated portfolio destinations to site actions", () => {
  for (const target of [
    "home",
    "work",
    "skills",
    "experience",
    "playground",
    "about",
    "contact",
  ]) {
    assert.deepEqual(resolveGuideLink(`#${target}`), {
      kind: "site",
      href: `#${target}`,
      action: { type: "navigate", target },
    });
  }
  for (const id of PROJECT_IDS) {
    assert.deepEqual(resolveGuideLink(`#project/${id}`), {
      kind: "site",
      href: `#project/${id}`,
      action: { type: "project", id },
    });
  }
  assert.deepEqual(resolveGuideLink("/#work"), resolveGuideLink("#work"));
});

test("all project stories remain ordinary links with or without a site-action handler", () => {
  for (const id of PROJECT_IDS) {
    const text = `[Read the story](/work/${id})`;
    const markup = render(text);
    assert.match(
      markup,
      new RegExp(`<a href="/work/${id}">Read the story</a>`),
    );
    const withoutHandler = renderToStaticMarkup(<GuideMarkdown text={text} />);
    assert.match(
      withoutHandler,
      new RegExp(`<a href="/work/${id}">Read the story</a>`),
    );
    assert.doesNotMatch(markup, /<button/);
  }
});

test("rejects executable, ambiguous and unknown link destinations", () => {
  for (const href of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:evil",
    "//example.com",
    "/api/preview",
    "#unknown",
    "#project/unknown",
    "https://user:password@example.com",
    "https:\\example.com",
    "https://",
    "java\nscript:evil",
    "https://example.com\u0000",
    "mailto:mark@example.com?body=anything",
    "mailto:mark@example.com%0d%0abcc:other@example.com",
  ])
    assert.equal(resolveGuideLink(href), null, href);
  const html = render(
    "[Unsafe](javascript:evil) [Hidden](java&#x73;cript:evil) [Unknown](#project/nope)",
  );
  assert.doesNotMatch(html, /<a\b|<button\b/);
  assert.match(html, /Unsafe/);
  assert.match(html, /Unknown/);
});

test("does not render raw HTML, images or event handlers", () => {
  const html = render(
    'Hello <img src="https://example.com/pixel" onerror="alert(1)">\n\n<script>alert(1)</script>\n\n![tracking](https://example.com/pixel)\n\n<iframe src="https://example.com"></iframe>',
  );
  assert.match(html, /Hello/);
  assert.doesNotMatch(html, /<script|<img|<iframe|onerror|example.com\/pixel/);
});

test("renders escaped code and scrollable GFM tables", () => {
  const html = render(
    "Use `const name = 'Mark'`.\n\n```html\n<script>alert(1)</script>\n```\n\n| Project | Focus |\n| --- | --- |\n| Courtfolio | Pickleball |\n\n~~Old idea~~",
  );
  assert.match(html, /<pre tabindex="0" aria-label="Code example">/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script/);
  assert.match(
    html,
    /class="guide-markdown-table" role="region" aria-label="Table" tabindex="0"/,
  );
  assert.match(html, /<th>Project<\/th>/);
  assert.match(html, /<del>Old idea<\/del>/);
});

test("plain and bold project names link to each of the six real story pages", () => {
  const html = render(
    "Mark built **PicklePals**, Courtfolio, HelloMarky, SelfHelp AI, Parking Buddy and Next Move Asia.",
  );
  for (const id of PROJECT_IDS)
    assert.match(html, new RegExp(`href="/work/${id}"`));
  assert.match(
    html,
    /<strong><a href="\/work\/pickle-pals">PicklePals<\/a><\/strong>/,
  );
});

test("links one automatic mention per project and preserves explicit links", () => {
  const html = render(
    "**PicklePals** has bookings. PicklePals also manages memberships. [Visit PicklePals](https://picklepals.example) and [Courtfolio](/work/courtfolio). Courtfolio keeps your memories.",
  );
  assert.equal((html.match(/href="\/work\/pickle-pals"/g) || []).length, 1);
  assert.equal((html.match(/href="\/work\/courtfolio"/g) || []).length, 1);
  assert.match(html, /href="https:\/\/picklepals.example\/"/);
  assert.doesNotMatch(html, /<a[^>]*>[^<]*<a/);
});

test("does not auto-link inside code, links, HTML, paths or longer words", () => {
  const html = render(
    "`PicklePals`\n\n```text\nCourtfolio\n```\n\n[PicklePals](javascript:evil) /products/PicklePals PicklePalsPro info@courtfolio.app\n\n<div>Courtfolio</div>\n\nParking Buddy is an app.",
  );
  assert.doesNotMatch(html, /href="\/work\/(?:pickle-pals|courtfolio)"/);
  assert.match(html, /href="\/work\/parking-buddy"/);
});

test("supports spacing, possessives and punctuation without guessing generic destinations", () => {
  const html = render(
    "Pickle Pals’ bookings, Hello Marky’s chat and Courtfolio. Self help and parking are general topics.",
  );
  assert.match(html, /href="\/work\/pickle-pals">Pickle Pals<\/a>’/);
  assert.match(html, /href="\/work\/hellomarky">Hello Marky<\/a>’/);
  assert.match(html, /href="\/work\/courtfolio">Courtfolio<\/a>\./);
  assert.doesNotMatch(html, /href="\/work\/(?:selfhelp-ai|parking-buddy)"/);
});
