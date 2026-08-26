import { describe, it, expect } from "vitest";
import { validatePublicUrl } from "../src/utils/urlValidator.js";

// =====================================================================
// Unit tests for urlValidator — the SSRF security guard.
//
// These are PURE function tests: no database, no network. They verify
// that dangerous URLs are rejected with a 400 AppError and that normal
// public URLs parse successfully.
// =====================================================================

describe("validatePublicUrl", () => {
  // ---- Valid public URLs pass through ----

  it("accepts a normal https URL", () => {
    const parsed = validatePublicUrl("https://github.com/expressjs/express");
    expect(parsed.hostname).toBe("github.com");
  });

  it("auto-prepends https:// when protocol is missing", () => {
    const parsed = validatePublicUrl("www.google.com");
    expect(parsed.protocol).toBe("https:");
    expect(parsed.hostname).toBe("www.google.com");
  });

  it("accepts http URLs", () => {
    const parsed = validatePublicUrl("http://example.com/page");
    expect(parsed.protocol).toBe("http:");
  });

  // ---- Malformed input is rejected with 400 ----

  it("rejects an empty string", () => {
    expect(() => validatePublicUrl("")).toThrow();
    try {
      validatePublicUrl("");
    } catch (e: any) {
      expect(e.statusCode).toBe(400);
    }
  });

  it("rejects garbage that is not a URL", () => {
    expect(() => validatePublicUrl("not a url at all")).toThrow();
  });

  it("rejects non-http protocols (javascript:, file:, data:)", () => {
    expect(() => validatePublicUrl("javascript:alert(1)")).toThrow(/only http/i);
    expect(() => validatePublicUrl("file:///etc/passwd")).toThrow(/only http/i);
    expect(() => validatePublicUrl("data:text/html,hello")).toThrow(/only http/i);
  });

  // ---- SSRF protection: localhost and private ranges ----

  it("rejects localhost by name", () => {
    expect(() => validatePublicUrl("http://localhost:8000/api/v1/auth/me")).toThrow(
      /not allowed/i
    );
  });

  it("rejects the IPv4 loopback address", () => {
    expect(() => validatePublicUrl("http://127.0.0.1:8000")).toThrow(
      /not allowed/i
    );
  });

  it("rejects other loopback-range addresses (127.x.x.x)", () => {
    expect(() => validatePublicUrl("http://127.0.0.5/x")).toThrow(
      /not allowed/i
    );
  });

  it("rejects the unspecified address 0.0.0.0", () => {
    expect(() => validatePublicUrl("http://0.0.0.0")).toThrow(/not allowed/i);
  });

  it("rejects private range 10.x.x.x", () => {
    expect(() => validatePublicUrl("http://10.0.0.1/admin")).toThrow(
      /not allowed/i
    );
  });

  it("rejects private range 192.168.x.x", () => {
    expect(() => validatePublicUrl("http://192.168.1.1")).toThrow(
      /not allowed/i
    );
  });

  it("rejects private range 172.16-31.x.x", () => {
    expect(() => validatePublicUrl("http://172.16.0.1")).toThrow(/not allowed/i);
    expect(() => validatePublicUrl("http://172.31.255.255")).toThrow(
      /not allowed/i
    );
  });

  it("allows public 172.x addresses outside the private range", () => {
    // 172.32+ is NOT private — this must be accepted
    const parsed = validatePublicUrl("https://172.32.0.1/");
    expect(parsed.hostname).toBe("172.32.0.1");
  });

  it("rejects link-local 169.254.x.x (cloud metadata endpoints)", () => {
    // This is THE classic AWS/GCP SSRF target — stealing cloud credentials.
    expect(() => validatePublicUrl("http://169.254.169.254/latest/meta-data")).toThrow(
      /not allowed/i
    );
  });

  it("rejects IPv6 loopback ::1", () => {
    expect(() => validatePublicUrl("http://[::1]:8000")).toThrow(
      /not allowed/i
    );
  });

  it("rejects IPv6 unique-local addresses (fd..)", () => {
    expect(() => validatePublicUrl("http://[fd00::1]/x")).toThrow(
      /not allowed/i
    );
  });
});
