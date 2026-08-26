import Link from "../models/linkModel.js";
import { checkLink } from "./linkCheckerService.js";
import { extractPreview } from "./previewScraperService.js";
import { validatePublicUrl } from "../utils/urlValidator.js";
import { normalizeTags } from "../utils/tags.js";
import AppError from "../utils/appError.js";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

async function scrapePreview(url: string): Promise<{
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });
    const html = await res.text();
    // Only read the first 100KB to avoid downloading huge pages.
    return extractPreview(html.slice(0, 100_000));
  } catch {
    return { title: null, description: null, imageUrl: null, siteName: null };
  }
}

async function findUserLink(linkId: string, userId: string) {
  const link = await Link.findOne({ _id: linkId, user: userId });
  if (!link) {
    throw new AppError("Link not found", 404);
  }
  return link;
}

export async function createLink(
  userId: string,
  rawUrl: unknown,
  rawTags?: unknown,
) {
  const url = validatePublicUrl(rawUrl as string).toString();
  const tags = normalizeTags(rawTags);

  const result = await checkLink(url);

  const preview =
    result.status === "ok"
      ? await scrapePreview(url)
      : { title: null, description: null, imageUrl: null, siteName: null };

  const link = await Link.create({
    user: userId,
    url,
    tags,
    status: result.status,
    httpStatus: result.httpStatus,
    title: preview.title,
    description: preview.description,
    imageUrl: preview.imageUrl,
    siteName: preview.siteName,
    lastCheckedAt: new Date(),
  });

  return link;
}

export async function getLinks(
  userId: string,
  query: {
    page?: string;
    limit?: string;
    status?: string;
    tag?: string;
    search?: string;
  },
) {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(query.limit ?? "20", 10) || 20),
  );
  const skip = (page - 1) * limit;

  // Build filter object: always scope to user
  const filterObj: Record<string, unknown> = { user: userId };

  if (query.status && ["ok", "dead", "checking"].includes(query.status)) {
    filterObj.status = query.status;
  }

  const tagFilter = query.tag?.trim().toLowerCase().replace(/^#+/, "");
  if (tagFilter && tagFilter !== "all") {
    filterObj.tags = tagFilter;
  }

  const searchTerm = query.search?.trim();
  const sortObj: Record<string, unknown> = { createdAt: -1 };

  if (searchTerm) {
    // Escape regex special characters for safe partial matching
    const safeSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(safeSearch, "i");

    // Match case-insensitive substring across title, url, description, siteName, and tags
    filterObj.$or = [
      { title: searchRegex },
      { url: searchRegex },
      { description: searchRegex },
      { siteName: searchRegex },
      { tags: searchRegex },
    ];
  }

  const [links, filteredTotal, totalCount, okCount, deadCount, rawTags] =
    await Promise.all([
      Link.find(filterObj)
        .sort(sortObj as any)
        .skip(skip)
        .limit(limit),
      Link.countDocuments(filterObj),
      Link.countDocuments({ user: userId }),
      Link.countDocuments({ user: userId, status: "ok" }),
      Link.countDocuments({ user: userId, status: "dead" }),
      Link.distinct("tags", { user: userId }),
    ]);

  const userTags = (rawTags as unknown[])
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .sort();

  return {
    links,
    pagination: {
      page,
      limit,
      total: filteredTotal,
      pages: Math.ceil(filteredTotal / limit) || 1,
    },
    counts: {
      total: totalCount,
      ok: okCount,
      dead: deadCount,
    },
    tags: userTags,
  };
}

export async function getLink(linkId: string, userId: string) {
  return findUserLink(linkId, userId);
}

export async function deleteLink(linkId: string, userId: string) {
  const link = await findUserLink(linkId, userId);
  await link.deleteOne();
  return link;
}

export async function updateLinkTags(
  linkId: string,
  userId: string,
  rawTags: unknown,
) {
  const link = await findUserLink(linkId, userId);
  link.tags = normalizeTags(rawTags);
  await link.save();
  return link;
}

export async function recheckLink(linkId: string, userId: string) {
  const link = await findUserLink(linkId, userId);

  const result = await checkLink(link.url);

  const preview =
    result.status === "ok"
      ? await scrapePreview(link.url)
      : { title: null, description: null, imageUrl: null, siteName: null };

  link.status = result.status;
  link.httpStatus = result.httpStatus;
  link.title = preview.title;
  link.description = preview.description;
  link.imageUrl = preview.imageUrl;
  link.siteName = preview.siteName;
  link.lastCheckedAt = new Date();

  await link.save();

  return link;
}
