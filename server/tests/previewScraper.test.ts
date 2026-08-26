import { describe, it, expect } from "vitest";
import { extractPreview } from "../src/services/previewScraperService.js";

// =====================================================================
// Unit tests for the og: preview scraper — pure function over an
// HTML string. No network, no database.
// =====================================================================

describe("extractPreview", () => {
  it("extracts all og: fields from a well-formed page", () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Express - Node.js web framework" />
        <meta property="og:description" content="Fast, unopinionated, minimalist web framework" />
        <meta property="og:image" content="https://expressjs.com/images/express.png" />
        <meta property="og:site_name" content="Express" />
      </head></html>
    `;
    const p = extractPreview(html);
    expect(p.title).toBe("Express - Node.js web framework");
    expect(p.description).toBe("Fast, unopinionated, minimalist web framework");
    expect(p.imageUrl).toBe("https://expressjs.com/images/express.png");
    expect(p.siteName).toBe("Express");
  });

  it("falls back to <title> when og:title is missing", () => {
    const html = `<html><head><title>Example Domain</title></head></html>`;
    const p = extractPreview(html);
    expect(p.title).toBe("Example Domain");
  });

  it("falls back to meta description when og:description is missing", () => {
    const html = `<html><head>
      <meta name="description" content="A plain meta description" />
    </head></html>`;
    const p = extractPreview(html);
    expect(p.description).toBe("A plain meta description");
  });

  it("prefers og: tags over fallbacks when both exist", () => {
    const html = `<html><head>
      <title>Boring title</title>
      <meta property="og:title" content="Rich OG Title" />
      <meta name="description" content="plain desc" />
      <meta property="og:description" content="rich desc" />
    </head></html>`;
    const p = extractPreview(html);
    expect(p.title).toBe("Rich OG Title");
    expect(p.description).toBe("rich desc");
  });

  it("handles attribute order swapped (content before property)", () => {
    const html = `<html><head>
      <meta content="Swapped order title" property="og:title" />
    </head></html>`;
    const p = extractPreview(html);
    expect(p.title).toBe("Swapped order title");
  });

  it("handles single-quoted attributes", () => {
    const html = `<html><head>
      <meta property='og:title' content='Single quoted' />
    </head></html>`;
    const p = extractPreview(html);
    expect(p.title).toBe("Single quoted");
  });

  it("returns nulls for a page with no metadata at all", () => {
    const html = `<html><head><style>body{color:red}</style></head></html>`;
    const p = extractPreview(html);
    expect(p.title).toBeNull();
    expect(p.description).toBeNull();
    expect(p.imageUrl).toBeNull();
    expect(p.siteName).toBeNull();
  });

  it("ignores empty-string og: values and falls back", () => {
    const html = `<html><head>
      <meta property="og:title" content="" />
      <title>Fallback Title</title>
    </head></html>`;
    const p = extractPreview(html);
    expect(p.title).toBe("Fallback Title");
  });
});
