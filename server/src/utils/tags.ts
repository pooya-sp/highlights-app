export function normalizeTags(rawTags: unknown): string[] {
  if (!rawTags) return [];

  let tagList: string[] = [];
  if (Array.isArray(rawTags)) {
    tagList = rawTags.map(String);
  } else if (typeof rawTags === "string") {
    tagList = rawTags.split(",");
  }

  const cleaned = tagList
    .map((t) => t.trim().toLowerCase().replace(/^#+/, ""))
    .filter((t) => t.length > 0 && t.length <= 30);

  return Array.from(new Set(cleaned));
}
