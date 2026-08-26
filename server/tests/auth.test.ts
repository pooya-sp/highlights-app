import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import request from "supertest";
import { app, startTestDb, stopTestDb, clearDb } from "./helpers.js";

// =====================================================================
// Integration tests: the full auth flow through real HTTP requests
// against the real Express app and an in-memory MongoDB.
// =====================================================================

beforeAll(async () => {
  await startTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await clearDb();
});

describe("POST /api/v1/auth/register", () => {
  it("registers a new user and auto-logs in (201 + token)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "pooya@test.com", password: "secret123" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe("pooya@test.com");
    // The password hash must NEVER leak into the response
    expect(res.body.data.user.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("$2");
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "dupe@test.com", password: "secret123" });

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "dupe@test.com", password: "otherpass" });

    expect(res.status).toBe(409);
  });

  it("rejects invalid email format with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "not-an-email", password: "secret123" });

    expect(res.status).toBe(400);
  });

  it("rejects short passwords with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "short@test.com", password: "abc" });

    expect(res.status).toBe(400);
  });

  it("stores a bcrypt hash, never the plain password", async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "hash@test.com", password: "plainTextPass" });

    const User = (await import("../src/models/userModel.js")).default;
    const user = await User.findOne({ email: "hash@test.com" }).select(
      "+password",
    );
    expect(user!.password).not.toBe("plainTextPass");
    // bcrypt hashes always start with $2a$/$2b$/$2y$
    expect(user!.password.startsWith("$2")).toBe(true);
  });
});

describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "login@test.com", password: "correctpass" });
  });

  it("logs in with correct credentials (200 + token)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "login@test.com", password: "correctpass" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it("returns generic 401 for a wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "login@test.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("returns THE SAME generic 401 for an unknown email (no enumeration)", async () => {
    const wrongPasswordRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "login@test.com", password: "wrongpass" });

    const unknownEmailRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ghost@test.com", password: "whatever123" });

    // Both failure modes must be indistinguishable
    expect(unknownEmailRes.status).toBe(401);
    expect(unknownEmailRes.body.message).toBe(wrongPasswordRes.body.message);
  });
});

describe("GET /api/v1/auth/me (protected route)", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with a garbage token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer not.a.real.token");
    expect(res.status).toBe(401);
  });

  it("returns the current user with a valid token", async () => {
    const reg = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "me@test.com", password: "secret123" });

    const token = reg.body.data.token;

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("me@test.com");
  });
});
