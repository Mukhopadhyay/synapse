import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cardRef, collectCardRefs } from "./lib/link-previews/cards.ts";
import { plainCard, type CardData } from "./lib/link-previews/index.ts";
import { normalizeUrl, pathTitle } from "./lib/link-previews/normalize.ts";
import { cleanText, DESCRIPTION_MAX, parseMetadata, TITLE_MAX } from "./lib/link-previews/parse.ts";
import { createBodyRenderer } from "./lib/render-body.ts";

const page = (head: string) => `<!doctype html><html><head>${head}</head><body><svg><title>Not this</title></svg></body></html>`;
const PAGE_URL = "https://example.com/posts/hello";

describe("link preview metadata", () => {
  it("prefers og tags, resolves relative URLs and reads image sizes", () => {
    const metadata = parseMetadata(
      page(`
        <title>Title tag</title>
        <meta name="description" content="Meta description">
        <meta name="twitter:title" content="Twitter title">
        <meta property="og:title" content="OG title">
        <meta property="og:description" content="OG description">
        <meta property="og:site_name" content="Example">
        <meta property="og:image" content="/images/card.png">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <link rel="icon" href="/favicon.ico">
        <link rel="apple-touch-icon" href="/touch.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png">
        <link rel="icon" type="image/svg+xml" href="/icon.svg">
      `),
      PAGE_URL,
    );
    assert.equal(metadata.title, "OG title");
    assert.equal(metadata.description, "OG description");
    assert.equal(metadata.siteName, "Example");
    assert.deepEqual(metadata.image, { src: "https://example.com/images/card.png", width: 1200, height: 630 });
    assert.deepEqual(metadata.favicons, [
      "https://example.com/icon.svg",
      "https://example.com/icon-32.png",
      "https://example.com/favicon.ico",
      "https://example.com/touch.png",
    ]);
  });

  it("falls back to twitter tags when og tags are missing", () => {
    const metadata = parseMetadata(
      page(`
        <title>Title tag</title>
        <meta name="description" content="Meta description">
        <meta name="twitter:title" content="Twitter title">
        <meta name="twitter:description" content="Twitter description">
        <meta name="twitter:image" content="https://cdn.example.com/t.jpg">
      `),
      PAGE_URL,
    );
    assert.equal(metadata.title, "Twitter title");
    assert.equal(metadata.description, "Twitter description");
    assert.equal(metadata.siteName, "");
    assert.deepEqual(metadata.image, { src: "https://cdn.example.com/t.jpg", width: null, height: null });
  });

  it("falls back to <title> and meta description, cleaned", () => {
    const metadata = parseMetadata(
      page(`
        <title>  Retrieval &amp; generation &mdash;
          a <b>guide</b> </title>
        <meta name="description" content="Fetch &lt;em&gt;then&lt;/em&gt; answer.&#10;Twice&nbsp;over.">
      `),
      PAGE_URL,
    );
    assert.equal(metadata.title, "Retrieval & generation — a guide");
    assert.equal(metadata.description, "Fetch then answer. Twice over.");
    assert.equal(metadata.image, null);
    assert.deepEqual(metadata.favicons, []);
  });

  it("ignores non-http image and icon URLs", () => {
    const metadata = parseMetadata(page(`<meta property="og:image" content="data:image/png;base64,AAAA"><link rel="icon" href="javascript:alert(1)">`), PAGE_URL);
    assert.equal(metadata.image, null);
    assert.deepEqual(metadata.favicons, []);
  });

  it("caps titles at 200 and descriptions at 300 characters", () => {
    const long = "word ".repeat(200);
    assert.equal(cleanText(long, TITLE_MAX).length, TITLE_MAX);
    assert.ok(cleanText(long, DESCRIPTION_MAX).endsWith("…"));
    assert.equal(cleanText(long, DESCRIPTION_MAX).length <= DESCRIPTION_MAX, true);
  });
});

describe("link preview URLs", () => {
  it("normalises cache keys and rejects non-http links", () => {
    assert.equal(normalizeUrl("https://Example.com/a?utm_source=x&q=1#top"), "https://example.com/a?q=1");
    assert.equal(normalizeUrl("mailto:someone@example.com"), null);
    assert.equal(normalizeUrl("not a url"), null);
  });

  it("titles a plain card with the URL's path", () => {
    assert.equal(pathTitle("https://arxiv.org/abs/2005.11401"), "/abs/2005.11401");
    assert.equal(pathTitle("https://www.example.com/"), "example.com");
  });
});

describe("bare URL to card", () => {
  it("finds compact and large cards, but only in paragraphs of their own", () => {
    const refs = collectCardRefs(
      [
        "https://arxiv.org/abs/2005.11401",
        "!https://www.anthropic.com/news/contextual-retrieval",
        "Read https://example.com/inline for more.",
        "[A titled link](https://example.com/titled)",
        "- https://example.com/in-a-list",
        "> https://example.com/in-a-quote",
        "ftp://example.com/file",
      ].join("\n\n"),
    );
    assert.deepEqual(refs, [
      { url: "https://arxiv.org/abs/2005.11401", large: false },
      { url: "https://www.anthropic.com/news/contextual-retrieval", large: true },
    ]);
  });

  it("ignores blocks that aren't paragraphs", () => {
    assert.equal(cardRef({ type: "thematicBreak" } as Parameters<typeof cardRef>[0]), null);
  });

  const resolve = (target: string) => ({ slug: target });
  const withImage = (href: string): CardData => ({
    href,
    title: "Contextual retrieval",
    description: "Better chunks.",
    domain: "anthropic.com",
    favicon: "/_previews/abc-32.webp",
    thumb: "/_previews/abc-144.webp",
    image: { src400: "/_previews/abc-400.webp", src800: "/_previews/abc-800.webp" },
  });

  it("renders a compact card as one external link, with a letter when there's no icon", async () => {
    const render = createBodyRenderer(resolve, plainCard);
    const { html } = await render("Intro.\n\nhttps://arxiv.org/abs/2005.11401\n\nSee https://example.com/inline too.");
    assert.match(html, /<a href="https:\/\/arxiv\.org\/abs\/2005\.11401" target="_blank" rel="noopener noreferrer" class="link-card">/);
    assert.match(html, /<span class="link-card-title">\/abs\/2005\.11401<\/span>/);
    assert.match(html, /<span class="link-card-favicon" aria-hidden="true">a<\/span>/);
    assert.doesNotMatch(html, /link-card-thumb/);
    assert.match(html, /<a href="https:\/\/example\.com\/inline">https:\/\/example\.com\/inline<\/a>/);
    assert.doesNotMatch(html, /<p>https:\/\/arxiv/);
  });

  it("renders a large card with a responsive image, and a compact one with a thumbnail", async () => {
    const render = createBodyRenderer(resolve, withImage);
    const { html } = await render("!https://www.anthropic.com/news/contextual-retrieval\n\nhttps://www.anthropic.com/news/contextual-retrieval");
    assert.match(html, /class="link-card link-card-large"/);
    assert.match(html, /srcset="\/_previews\/abc-400\.webp 400w, \/_previews\/abc-800\.webp 800w"/);
    assert.match(html, /<img class="link-card-thumb" src="\/_previews\/abc-144\.webp" alt="" width="72" height="72"/);
    assert.match(html, /<img src="\/_previews\/abc-32\.webp" alt="" width="16" height="16"/);
  });

  it("falls back to compact when a large card has no image", async () => {
    const render = createBodyRenderer(resolve, plainCard);
    const { html } = await render("!https://www.anthropic.com/news/contextual-retrieval");
    assert.match(html, /class="link-card"/);
    assert.doesNotMatch(html, /link-card-large/);
  });
});
