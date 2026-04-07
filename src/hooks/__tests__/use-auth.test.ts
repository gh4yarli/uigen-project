import { test, expect, vi, beforeEach, describe } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAuth — signIn", () => {
  test("returns the result from signInAction", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: false, error: "Invalid credentials" });
    vi.mocked(getAnonWorkData).mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    let returnValue: { success: boolean; error?: string } | undefined;
    await act(async () => {
      returnValue = await result.current.signIn("user@example.com", "wrongpass");
    });

    expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
  });

  test("sets isLoading to true while signing in, then false after", async () => {
    let resolveSignIn!: (value: { success: boolean }) => void;
    vi.mocked(signInAction).mockReturnValue(
      new Promise((resolve) => { resolveSignIn = resolve; })
    );

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(false);

    let signInPromise: Promise<unknown>;
    act(() => {
      signInPromise = result.current.signIn("user@example.com", "password123");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveSignIn({ success: false, error: "Error" });
      await signInPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("does not navigate when signIn fails", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: false, error: "Invalid credentials" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "wrongpass");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  describe("post sign-in: anon work exists with messages", () => {
    test("creates a project with anon work, clears it, and navigates to the project", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Hello" }],
        fileSystemData: { "/App.jsx": "export default () => <div/>" },
      };
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(anonWork);
      vi.mocked(createProject).mockResolvedValue({ id: "proj-anon-123" } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonWork.messages,
          data: anonWork.fileSystemData,
        })
      );
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-anon-123");
      expect(getProjects).not.toHaveBeenCalled();
    });
  });

  describe("post sign-in: no anon work, existing projects", () => {
    test("navigates to the most recent project", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([
        { id: "proj-recent" } as any,
        { id: "proj-older" } as any,
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-recent");
      expect(createProject).not.toHaveBeenCalled();
    });
  });

  describe("post sign-in: no anon work, no existing projects", () => {
    test("creates a new project and navigates to it", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({ id: "proj-new-456" } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({ messages: [], data: {} })
      );
      expect(mockPush).toHaveBeenCalledWith("/proj-new-456");
    });
  });

  describe("post sign-in: anon work with empty messages", () => {
    test("falls through to project lookup when anon work has no messages", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue({ messages: [], fileSystemData: {} });
      vi.mocked(getProjects).mockResolvedValue([{ id: "proj-existing" } as any]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProject).not.toHaveBeenCalled();
      expect(clearAnonWork).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-existing");
    });
  });
});

describe("useAuth — signUp", () => {
  test("returns the result from signUpAction", async () => {
    vi.mocked(signUpAction).mockResolvedValue({ success: false, error: "Email already registered" });
    vi.mocked(getAnonWorkData).mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    let returnValue: { success: boolean; error?: string } | undefined;
    await act(async () => {
      returnValue = await result.current.signUp("existing@example.com", "password123");
    });

    expect(returnValue).toEqual({ success: false, error: "Email already registered" });
  });

  test("sets isLoading to true while signing up, then false after", async () => {
    let resolveSignUp!: (value: { success: boolean }) => void;
    vi.mocked(signUpAction).mockReturnValue(
      new Promise((resolve) => { resolveSignUp = resolve; })
    );

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(false);

    let signUpPromise: Promise<unknown>;
    act(() => {
      signUpPromise = result.current.signUp("new@example.com", "password123");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveSignUp({ success: false });
      await signUpPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("does not navigate when signUp fails", async () => {
    vi.mocked(signUpAction).mockResolvedValue({ success: false, error: "An error occurred" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "password123");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  test("navigates to new project when signUp succeeds with no prior work", async () => {
    vi.mocked(signUpAction).mockResolvedValue({ success: true });
    vi.mocked(getAnonWorkData).mockReturnValue(null);
    vi.mocked(getProjects).mockResolvedValue([]);
    vi.mocked(createProject).mockResolvedValue({ id: "proj-signup-789" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/proj-signup-789");
  });

  test("creates project with anon work when signUp succeeds and anon work exists", async () => {
    const anonWork = {
      messages: [{ role: "user", content: "Build me a button" }],
      fileSystemData: { "/App.jsx": "export default () => <button/>" },
    };
    vi.mocked(signUpAction).mockResolvedValue({ success: true });
    vi.mocked(getAnonWorkData).mockReturnValue(anonWork);
    vi.mocked(createProject).mockResolvedValue({ id: "proj-anon-new" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "password123");
    });

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      })
    );
    expect(clearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/proj-anon-new");
  });
});

describe("useAuth — initial state", () => {
  test("exposes signIn, signUp, and isLoading", () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
    expect(result.current.isLoading).toBe(false);
  });
});
