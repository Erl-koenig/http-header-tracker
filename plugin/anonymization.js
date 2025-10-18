const ALWAYS_ANONYMIZE = new Set([
  "authorization",
  "proxy-authorization",
  "www-authenticate",
  "proxy-authenticate",
  "cookie",
  "set-cookie",
  "x-csrf-token",
  "csrf-token",
  "x-api-key",
  "api-key",
  "host",
  "referer",
  "origin",
  ":authority",
  ":path",
  "x-forwarded-for",
  "x-real-ip",
  "x-client-ip",
  "cf-connecting-ip",
  "true-client-ip",
  "x-forwarded-host",
  "forwarded",
  "user-agent",
  "cart-token",
  "x-conduit-token",
  "x-conduit-tokens",
  "x-conduit-worker",
  "x-netflix.request.growth.session.id",
]);

function looksLikeSecret(value) {
  if (!value || value.length < 20) return false;
  if (value.length >= 2000) return true;

  // JWT tokens (three base64 segments separated by dots)
  if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(value)) {
    return true;
  }

  if (/^Bearer\s+[A-Za-z0-9-_]{20,}/i.test(value)) {
    return true;
  }

  // UUID patterns
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    return true;
  }

  // Hex-encoded tokens (32-64 chars)
  if (/^[0-9a-f]{32,64}$/i.test(value)) {
    return true;
  }

  // Long base64-like strings (> 40 chars)
  if (value.length > 40 && /^[A-Za-z0-9+/=_-]+$/.test(value)) {
    return true;
  }

  return false;
}

function headerNameSuggestsSecret(name) {
  const lowerName = name.toLowerCase();

  const secretKeywords = [
    "token",
    "secret",
    "key",
    "auth",
    "session",
    "password",
    "credential",
    "private",
  ];

  return secretKeywords.some((keyword) => lowerName.includes(keyword));
}

function shouldAnonymizeHeader(headerName, headerValue) {
  if (ALWAYS_ANONYMIZE.has(headerName.toLowerCase())) {
    return true;
  }
  if (looksLikeSecret(headerValue)) {
    return true;
  }
  if (headerNameSuggestsSecret(headerName)) {
    return true;
  }

  return false;
}

// avoid erros in browser, export for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ALWAYS_ANONYMIZE,
    looksLikeSecret,
    headerNameSuggestsSecret,
    shouldAnonymizeHeader,
  };
}
