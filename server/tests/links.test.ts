import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import request from "supertest";
import { app, startTestDb, stopTestDb, clearDb } from "./helpers.js";

// =====================================================================
// Integration tests: link CRUD + ownership scoping + tag filtering.
//
// NOTE on health checks: createLink fires a real outbound fetch to the
// target URL. We use https://example.com (extremely stable) for the
// "alive" case and a guaranteed-nonexistent domain for the "dead" case.
// =====================================================================

const STABLE_URL = "https://example.com/";
const DEAD_URL = "https://this-domain-does-not-exist-8f3k2.com/";

let tokenA: string; // user A
let tokenB: string; // user B

async function registerAndGetToken(email: string): Promise<string> {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password: "secret123" });
  return res.body.data.token as string;
}

beforeAll(async () => {
  await startTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearDb();
  tokenA = await registerAndGetToken("userA@test.com");
  tokenB = await registerAndGetToken("userB@test.com");
});

describe("POST /api/v1/links", () => {
  it("saves a healthy link with status ok (201)", async () => {
    const res = await request(app)
      .post("/api/v1/links")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ url: STABLE_URL });

    expect(res.status).toBe(201);
    expect(res.body.data.link.status).toBe("ok");
    expect(res.body.data.link.httpStatus).toBe(200);
    // example.com has a <title> tag — the scraper fallback should find it
    expect(res.body.data.link.title).toBeTruthy();
  }, 15000);

  it("saves a dead link with status dead (201) instead of erroring", async () => {
    const res = await request(app)
      .post("/api/v1/links")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ url: DEAD_URL });

    expect(res.status).toBe(201);
    expect(res.body.data.link.status).toBe("dead");
  }, 15000);

  it("normalizes URLs without a protocol", async () => {
    const res = await request(app)
      .post("/api/v1/links")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ url: "example.com" });

    expect(res.status).toBe(201);
    expect(res.body.data.link.url).toMatch(/^https:\/\/example\.com/);
  }, 15000);

  it("stores normalized tags", async () => {
    const res = await request(app)
      .post("/api/v1/links")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ url: STABLE_URL, tags: "#Tech, react, TECH" });

    expect(res.status).toBe(201);
    expect(res.body.data.link.tags).toEqual(["tech", "react"]);
  }, 15000);

  it("rejects SSRF attempts against localhost with 400", async () => {
    const res = await request(app)
      .post("/api/v1/links")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ url: "http://localhost:8000/api/v1/auth/me" });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/not allowed/i);
  });

  it("requires authentication (401 without token)", async () => {
    const res = await request(app).post("/api/v1/links").send({ url: STABLE_URL });
    expect(res.status).toBe(401);
  });
});

describe("ownership scoping", () => {
  let linkIdOfA: string;

  beforeEach(async () => {
    const res = await request(app)
      .post("/api/v1/links")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ url: STABLE_URL });
    linkIdOfA = res.body.data.link._id;
  }, 15000);

  it("lets user A see their own link", async () => {
    const res = await request(app)
      .get(`/api/v1/links/${linkIdOfA}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
  });

  it("hides user A's link from user B (404, not 403 — no existence leak)", async () => {
    const res = await request(app)
      .get(`/api/v1/links/${linkIdOfA}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it("prevents user B from deleting user A's link", async () => {
    const res = await request(app)
      .delete(`/api/v1/links/${linkIdOfA}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);

    // The link must still exist for user A
    const stillThere = await request(app)
      .get(`/api/v1/links/${linkIdOfA}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(stillThere.status).toBe(200);
  });

  it("scopes list results to the requesting user only", async () => {
    // B saves their own link
    await request(app)
      .post("/api/v1/links")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ url: DEAD_URL });

    const listA = await request(app)
      .get("/api/v1/links")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(listA.body.data.counts.total).toBe(1); // only A's link

    const listB = await request(app)
      .get("/api/v1/links")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(listB.body.data.counts.total).toBe(1); // only B's link
  });
});

describe("GET /api/v1/links — filtering, search, tags", () => {
  beforeEach(async () => {
    // A saves two links with different statuses and tags
    await request(app)
      .post("/api/v1/links")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ url: STABLE_URL, tags: "tech, reading" });

    await request(app)
      .post("/api/v1/links")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ url: DEAD_URL, tags: "tech" });
  }, 30000);

  it("returns global counts across the user's shelf", async () => {
    const res = await request(app)
      .get("/api/v1/links")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.body.data.counts).toEqual({
      total: 2,
      ok: 1,
      dead: 1,
    });
    expect(res.body.data.tags.sort()).toEqual(["reading", "tech"]);
  }, 15000);

  it("filters by status=ok", async () => {
    const res = await request(app)
      .get("/api/v1/links?status=ok")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.body.data.links).toHaveLength(1);
    expect(res.body.data.links[0].status).toBe("ok");
    expect(res.body.data.pagination.total).toBe(1);
  }, 15000);

  it("filters by tag", async () => {
    const res = await request(app)
      .get("/api/v1/links?tag=reading")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.body.data.links).toHaveLength(1);
    expect(res.body.data.links[0].tags).toContain("reading");
  }, 15000);

  it("searches across title/url/tags case-insensitively", async () => {
    const res = await request(app)
      .get("/api/v1/links?search=example")
      .set("Authorization", `Bearer ${tokenA}`);

    // Only the alive example.com link matches "example"
    expect(res.body.data.links).toHaveLength(1);
    expect(res.body.data.links[0].url).toContain("example.com");
  }, 15000);

  it("paginates correctly", async () => {
    const page1 = await request(app)
      .get("/api/v1/links?limit=1&page=1")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(page1.body.data.links).toHaveLength(1);
    expect(page1.body.data.pagination.pages).toBe(2);

    const page2 = await request(app)
      .get("/api/v1/links?limit=1&page=2")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(page2.body.data.links).toHaveLength(1);
    // The two links must be different documents
    expect(page2.body.data.links[0]._id).not.toBe(page1.body.data.links[0]._id);
  }, 15000);
});

describe("PATCH /api/v1/links/:id/tags", () => {
  let linkId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post("/api/v1/links")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ url: STABLE_URL, tags: ["old"] });
    linkId = res.body.data.link._id;
  }, 15000);

  it("replaces the tag list of a link", async () => {
    const res = await request(app)
      .patch(`/api/v1/links/${linkId}/tags`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ tags: ["new", "shiny"] });

    expect(res.status).toBe(200);
    expect(res.body.data.link.tags).toEqual(["new", "shiny"]);
  });

  it("is blocked for other users (404)", async () => {
    const res = await request(app)
      .patch(`/api/v1/links/${linkId}/tags`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ tags: ["hack"] });
    expect(res.status).toBe(404);
  });
});
