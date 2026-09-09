/** Cookie helpers for Super Admin + better-auth session cookie signing. */

export type CookieSerializeOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
  path?: string;
  maxAge?: number;
};

/** Standard base64 (with padding). better-call getSignedCookie requires length 44 and trailing `=`. */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Matches better-call's signed cookie format used by better-auth:
 * `encodeURIComponent(value.<HMAC-SHA256 standard-base64>)` with BETTER_AUTH_SECRET.
 */
async function signCookieValue(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return encodeURIComponent(
    `${value}.${toBase64(new Uint8Array(signature))}`,
  );
}

function serializeCookieHeader(
  name: string,
  value: string,
  options: CookieSerializeOptions,
): string {
  let cookie = `${name}=${value}`;
  if (typeof options.maxAge === "number" && options.maxAge >= 0) {
    cookie += `; Max-Age=${Math.floor(options.maxAge)}`;
  }
  if (options.path) {
    cookie += `; Path=${options.path}`;
  }
  if (options.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (
    options.secure ||
    name.startsWith("__Secure-") ||
    name.startsWith("__Host-")
  ) {
    cookie += "; Secure";
  }
  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  }
  return cookie;
}

export function serializePlainCookie(
  name: string,
  value: string,
  options: CookieSerializeOptions,
): string {
  return serializeCookieHeader(name, encodeURIComponent(value), options);
}

export async function serializeSignedCookieHeader(
  name: string,
  value: string,
  secret: string,
  options: CookieSerializeOptions,
): Promise<string> {
  const signedValue = await signCookieValue(value, secret);
  return serializeCookieHeader(name, signedValue, options);
}

export function parseCookieHeader(
  cookieHeader: string | null,
): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!cookieHeader) {
    return cookies;
  }
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (!name) continue;
    try {
      cookies.set(name, decodeURIComponent(value));
    } catch {
      cookies.set(name, value);
    }
  }
  return cookies;
}

export function readRequestCookie(
  headers: Headers,
  name: string,
): string | null {
  return parseCookieHeader(headers.get("cookie")).get(name) ?? null;
}

export function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    diff |= left ^ right;
  }
  return diff === 0;
}

async function sha256Bytes(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return new Uint8Array(digest);
}

/** Timing-safe string compare via SHA-256 digests (equal length for timingSafeEqual). */
export async function timingSafeEqualString(
  left: string,
  right: string,
): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([
    sha256Bytes(left),
    sha256Bytes(right),
  ]);
  return timingSafeEqualBytes(leftHash, rightHash);
}
