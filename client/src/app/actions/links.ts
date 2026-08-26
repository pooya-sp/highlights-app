"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";

const COOKIE_NAME = "hl_token";

async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    throw new Error("Authentication required. Please log in.");
  }
  return token;
}

export async function createLinkAction(
  _prevState: { error: string | null; success: boolean } | null,
  formData: FormData
) {
  const url = formData.get("url") as string;
  const tagsString = formData.get("tags") as string;

  if (!url) {
    return { error: "Please provide a URL", success: false };
  }

  const tags = tagsString
    ? tagsString.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  try {
    const token = await getAuthToken();
    await api.createLink(token, url, tags);
    revalidatePath("/dashboard");
    return { error: null, success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create link",
      success: false,
    };
  }
}

export async function deleteLinkAction(linkId: string) {
  try {
    const token = await getAuthToken();
    await api.deleteLink(token, linkId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete link",
    };
  }
}

export async function recheckLinkAction(linkId: string) {
  try {
    const token = await getAuthToken();
    await api.recheckLink(token, linkId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to recheck link",
    };
  }
}

export async function updateLinkTagsAction(linkId: string, tags: string[]) {
  try {
    const token = await getAuthToken();
    await api.updateLinkTags(token, linkId, tags);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update tags",
    };
  }
}
