const {
  ALWAYS_ANONYMIZE,
  looksLikeSecret,
  headerNameSuggestsSecret,
  shouldAnonymizeHeader,
} = require("./anonymization");

describe("looksLikeSecret", () => {
  test("returns false for non-secrets", () => {
    expect(looksLikeSecret("")).toBe(false);
    expect(looksLikeSecret(null)).toBe(false);
    expect(looksLikeSecret("short")).toBe(false);
    expect(looksLikeSecret("application/json")).toBe(false);
  });

  test("detects secret patterns", () => {
    // JWT
    expect(
      looksLikeSecret(
        "eyJhbGciOiJIUzI1AiIsInR5cCI8IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc",
      ),
    ).toBe(true);

    // Bearer tokens (>= 20 chars after Bearer)
    expect(looksLikeSecret("Bearer 12345678901234567890")).toBe(true);

    // UUID
    expect(looksLikeSecret("550e8400-e29b-41d4-a716-446655440000")).toBe(true);

    // Hex tokens (32-64 chars)
    expect(looksLikeSecret("a1b2c3d4e5f6789012345678901234ab")).toBe(true);

    // Long base64-like strings (> 40 chars)
    expect(looksLikeSecret("a1b2c3d4r5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u")).toBe(
      true,
    );

    // Very long strings (>= 2000 chars)
    expect(looksLikeSecret("a".repeat(2000))).toBe(true);
  });
});

describe("headerNameSuggestsSecret", () => {
  test("returns true for headers with secret keywords (case insensitive)", () => {
    expect(headerNameSuggestsSecret("X-Auth-Token")).toBe(true);
    expect(headerNameSuggestsSecret("Authorization")).toBe(true);
    expect(headerNameSuggestsSecret("Session-ID")).toBe(true);
    // Case insensitivity
    expect(headerNameSuggestsSecret("X-AUTH-TOKEN")).toBe(true);
    expect(headerNameSuggestsSecret("session-id")).toBe(true);
  });

  test("returns false for normal headers", () => {
    expect(headerNameSuggestsSecret("Content-Type")).toBe(false);
    expect(headerNameSuggestsSecret("Accept")).toBe(false);
    expect(headerNameSuggestsSecret("Content-Length")).toBe(false);
    expect(headerNameSuggestsSecret("Cache-Control")).toBe(false);
  });
});

describe("shouldAnonymizeHeader", () => {
  test("anonymizes headers in ALWAYS_ANONYMIZE set regardless of value", () => {
    expect(shouldAnonymizeHeader("Authorization", "Bearer token123")).toBe(
      true,
    );
    expect(shouldAnonymizeHeader("authorization", "Basic abc123")).toBe(true);
    expect(shouldAnonymizeHeader("Cookie", "session=abc123")).toBe(true);
    expect(shouldAnonymizeHeader("Set-Cookie", "session=abc123")).toBe(true);
    expect(shouldAnonymizeHeader("Host", "example.com")).toBe(true);
    expect(shouldAnonymizeHeader("Origin", "https://example.com")).toBe(true);
    expect(shouldAnonymizeHeader("X-Forwarded-For", "192.168.1.1")).toBe(true);
    expect(shouldAnonymizeHeader("X-API-Key", "abc123")).toBe(true);
    expect(shouldAnonymizeHeader("User-Agent", "Mozilla/5.0")).toBe(true);
    // short/empty values
    expect(shouldAnonymizeHeader("Cookie", "simple")).toBe(true);
    expect(shouldAnonymizeHeader("Authorization", "")).toBe(true);
  });

  test("anonymizes headers with secret-looking values", () => {
    expect(
      shouldAnonymizeHeader(
        "X-Custom-Header",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123",
      ),
    ).toBe(true); // JWT
    expect(
      shouldAnonymizeHeader(
        "X-Request-ID",
        "550e8400-e29b-41d4-a716-446655440000",
      ),
    ).toBe(true); // UUID
    expect(
      shouldAnonymizeHeader("X-Trace-ID", "a1b2c3d4e5f6789012345678901234ab"),
    ).toBe(true); // Hex token
    expect(
      shouldAnonymizeHeader(
        "X-Data",
        "SGVsbG8gV29ybGQgdGhpcyBpcyBhIHZlcnkgbG9uZyBzdHJpbmcgdGhhdCBsb29rcyBsaWtlIGJhc2U2NA==",
      ),
    ).toBe(true); // Base64
  });

  test("anonymizes headers with secret-suggesting names", () => {
    expect(shouldAnonymizeHeader("X-Access-Token", "short")).toBe(true);
    expect(shouldAnonymizeHeader("X-Auth-Header", "value")).toBe(true);
    expect(shouldAnonymizeHeader("X-Session-ID", "12345")).toBe(true);
    expect(shouldAnonymizeHeader("X-Private-Data", "data")).toBe(true);
  });

  test("does NOT anonymize normal headers with normal values", () => {
    expect(shouldAnonymizeHeader("Content-Type", "application/json")).toBe(
      false,
    );
    expect(shouldAnonymizeHeader("Accept", "text/html")).toBe(false);
    expect(shouldAnonymizeHeader("Cache-Control", "no-cache")).toBe(false);
    expect(shouldAnonymizeHeader("Content-Length", "1234")).toBe(false);
    expect(shouldAnonymizeHeader("X-Custom", "")).toBe(false);
  });

  test("works with type parameter for both request and response headers", () => {
    // Request headers
    expect(shouldAnonymizeHeader("Cookie", "session=abc", "request")).toBe(
      true,
    );
    expect(
      shouldAnonymizeHeader("Authorization", "Bearer token", "request"),
    ).toBe(true);
    expect(shouldAnonymizeHeader("Accept", "application/json", "request")).toBe(
      false,
    );
    // Response headers
    expect(shouldAnonymizeHeader("Set-Cookie", "session=abc", "response")).toBe(
      true,
    );
    expect(shouldAnonymizeHeader("Content-Type", "text/html", "response")).toBe(
      false,
    );
    expect(shouldAnonymizeHeader("Host", "example.com")).toBe(true);
  });
});

describe("ALWAYS_ANONYMIZE set", () => {
  test("contains expected security-sensitive headers in lowercase", () => {
    expect(ALWAYS_ANONYMIZE.has("authorization")).toBe(true);
    expect(ALWAYS_ANONYMIZE.has("cookie")).toBe(true);
    expect(ALWAYS_ANONYMIZE.has("host")).toBe(true);

    // Verify all are lowercase
    ALWAYS_ANONYMIZE.forEach((header) => {
      expect(header).toBe(header.toLowerCase());
    });
  });
});
