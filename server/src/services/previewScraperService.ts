export interface LinkPreview {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

function ogContent(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapeRegExp(property)}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escapeRegExp(property)}["']`,
    "i",
  );
  const m = html.match(re);
  if (!m) return null;
  const val = (m[1] ?? m[2] ?? "").trim();
  return val.length > 0 ? val : null;
}

// Matches: <title>Some Title</title> (multiline-safe, greedy until </title>)
function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const val = m[1].replace(/\s+/g, " ").trim();
  return val.length > 0 ? val : null;
}

// Matches: <meta name="description" content="..." />
function metaDescription(html: string): string | null {
  const m = html.match(
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i,
  );
  if (!m) return null;
  const val = (m[1] ?? m[2] ?? "").trim();
  return val.length > 0 ? val : null;
}

// Escape special regex characters in a string (for property names).
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractPreview(html: string): LinkPreview {
  const title = ogContent(html, "og:title") ?? titleTag(html);
  const description =
    ogContent(html, "og:description") ?? metaDescription(html);
  const imageUrl = ogContent(html, "og:image");
  const siteName = ogContent(html, "og:site_name");

  return { title, description, imageUrl, siteName };
}
