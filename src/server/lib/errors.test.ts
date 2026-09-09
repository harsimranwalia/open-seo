import { describe, expect, it } from "vitest";
import { AppError, toClientError } from "@/server/lib/errors";

describe("toClientError", () => {
  it("sanitizes detailed internal error messages", () => {
    const error = toClientError(
      new AppError(
        "INTERNAL_ERROR",
        "DataForSEO task missing billing metadata (path: Invalid input). Response: {...}",
      ),
    );

    expect(error.message).toBe("INTERNAL_ERROR");
  });

  it("keeps public error codes unchanged", () => {
    const error = toClientError(new AppError("PAYMENT_REQUIRED"));

    expect(error.message).toBe("PAYMENT_REQUIRED");
  });

  it("passes setup-error detail through as CODE: detail", () => {
    const error = toClientError(
      new AppError(
        "AUTH_CONFIG_MISSING",
        "BETTER_AUTH_SECRET must be at least 32 characters",
      ),
    );

    expect(error.message).toBe(
      "AUTH_CONFIG_MISSING: BETTER_AUTH_SECRET must be at least 32 characters",
    );
  });

  it("keeps a detail-less setup error as its bare code", () => {
    const error = toClientError(new AppError("AUTH_CONFIG_MISSING"));

    expect(error.message).toBe("AUTH_CONFIG_MISSING");
  });
});
