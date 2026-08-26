export type LinkCheckResult = {
  status: "ok" | "dead";
  httpStatus?: number;
};

const REQUEST_TIMEOUT_MS = 5000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export async function checkLink(url: string): Promise<LinkCheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // Real browser User-Agent: stops some sites (Twitter, Cloudflare,
        // etc.) from blocking us as a bot.
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timer);

    if (response.ok) {
      // 200-299 — the link is healthy.
      return { status: "ok", httpStatus: response.status };
    }

    // 3xx other than auto-followed (rare), 4xx, 5xx — not healthy.
    return { status: "dead", httpStatus: response.status };
  } catch {
    // Any of: timeout (AbortError), DNS failure, refused connection,
    // TLS error, network down. All of them mean the link is unreachable.
    clearTimeout(timer);
    return { status: "dead" };
  }
}
