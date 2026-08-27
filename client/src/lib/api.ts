import type {
  ApiError,
  AuthResponse,
  Link,
  LinksResponse,
} from "./types";

// =====================================================================
// api.ts — Pure fetch helper for server-side & client-side communication
// =====================================================================

// Strip any trailing slash so we never get double-slash in the URL.
// e.g. "https://example.railway.app/" → "https://example.railway.app"
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:20000").replace(/\/+$/, "");

interface RequestOptions {
  method?: string;
  token?: string | null;
  body?: unknown;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const err = (await res.json()) as ApiError;
      if (err?.message) message = err.message;
    } catch {
      // response body was not valid JSON
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export const api = {
  register(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: { email, password },
    });
  },

  login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },

  getLinks(
    token: string,
    page = 1,
    limit = 20,
    status?: string,
    search?: string,
    tag?: string
  ): Promise<LinksResponse> {
    const statusQuery = status && status !== "all" ? `&status=${status}` : "";
    const searchQuery = search ? `&search=${encodeURIComponent(search)}` : "";
    const tagQuery = tag && tag !== "all" ? `&tag=${encodeURIComponent(tag)}` : "";
    return request<LinksResponse>(
      `/api/v1/links?page=${page}&limit=${limit}${statusQuery}${searchQuery}${tagQuery}`,
      { token }
    );
  },

  createLink(
    token: string,
    url: string,
    tags?: string[]
  ): Promise<{ status: string; data: { link: Link } }> {
    return request<{ status: string; data: { link: Link } }>("/api/v1/links", {
      method: "POST",
      token,
      body: { url, tags },
    });
  },

  deleteLink(token: string, id: string): Promise<{ status: string; data: null }> {
    return request<{ status: string; data: null }>(`/api/v1/links/${id}`, {
      method: "DELETE",
      token,
    });
  },

  recheckLink(
    token: string,
    id: string
  ): Promise<{ status: string; data: { link: Link } }> {
    return request<{ status: string; data: { link: Link } }>(
      `/api/v1/links/${id}/recheck`,
      {
        method: "POST",
        token,
      }
    );
  },

  updateLinkTags(
    token: string,
    id: string,
    tags: string[]
  ): Promise<{ status: string; data: { link: Link } }> {
    return request<{ status: string; data: { link: Link } }>(
      `/api/v1/links/${id}/tags`,
      {
        method: "PATCH",
        token,
        body: { tags },
      }
    );
  },
};
