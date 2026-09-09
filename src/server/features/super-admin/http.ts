import { AppError } from "@/server/lib/errors";
import { responseForAppError } from "@/server/lib/http-errors";

export function jsonWithCookies(
  body: unknown,
  setCookies: string[],
  init?: ResponseInit,
): Response {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  for (const cookie of setCookies) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(JSON.stringify(body), {
    ...init,
    status: init?.status ?? 200,
    headers,
  });
}

export async function readJsonBody<T>(
  request: Request,
  parse: (value: unknown) => T,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Invalid JSON body");
  }
  return parse(raw);
}

export function handleSuperAdminApiError(
  error: unknown,
  fallbackMessage: string,
): Response {
  return responseForAppError(error, fallbackMessage);
}
