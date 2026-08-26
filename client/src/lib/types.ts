// Shared types matching the backend API responses.

export type LinkStatus = "ok" | "dead" | "checking";

export interface Link {
  _id: string;
  url: string;
  tags?: string[];
  status: LinkStatus;
  httpStatus?: number | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GlobalCounts {
  total: number;
  ok: number;
  dead: number;
}

export interface LinksResponse {
  status: string;
  data: {
    links: Link[];
    pagination: Pagination;
    counts: GlobalCounts;
    tags: string[];
  };
}

export interface AuthResponse {
  status: string;
  data: {
    token: string;
    user: { id: string; email: string; createdAt: string };
  };
}

export interface ApiError {
  status: string;
  message: string;
}
