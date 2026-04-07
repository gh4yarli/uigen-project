import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const cookieStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: (name: string) =>
        cookieStore.has(name) ? { value: cookieStore.get(name) } : undefined,
      set: (name: string, value: string) => cookieStore.set(name, value),
      delete: (name: string) => cookieStore.delete(name),
    })
  ),
}));

beforeEach(() => {
  cookieStore.clear();
});

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

test("createSession sets the auth-token cookie", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-123", "user@example.com");

  expect(cookieStore.has("auth-token")).toBe(true);
});

test("createSession JWT contains userId and email", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-123", "user@example.com");

  const token = cookieStore.get("auth-token")!;
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("user@example.com");
});
