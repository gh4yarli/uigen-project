import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getToolLabel } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create returns Creating path", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "call",
  } as ToolInvocation;
  expect(getToolLabel(tool)).toBe("Creating /App.jsx");
});

test("getToolLabel: str_replace_editor str_replace returns Editing path", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/App.jsx" },
    state: "call",
  } as ToolInvocation;
  expect(getToolLabel(tool)).toBe("Editing /App.jsx");
});

test("getToolLabel: str_replace_editor insert returns Editing path", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "insert", path: "/components/Button.jsx" },
    state: "call",
  } as ToolInvocation;
  expect(getToolLabel(tool)).toBe("Editing /components/Button.jsx");
});

test("getToolLabel: str_replace_editor view returns Viewing path", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "view", path: "/App.jsx" },
    state: "call",
  } as ToolInvocation;
  expect(getToolLabel(tool)).toBe("Viewing /App.jsx");
});

test("getToolLabel: str_replace_editor undo_edit returns Undoing edit in path", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "undo_edit", path: "/App.jsx" },
    state: "call",
  } as ToolInvocation;
  expect(getToolLabel(tool)).toBe("Undoing edit in /App.jsx");
});

test("getToolLabel: str_replace_editor with no args falls back to Editing file", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: {},
    state: "call",
  } as ToolInvocation;
  expect(getToolLabel(tool)).toBe("Editing file");
});

test("getToolLabel: file_manager rename returns Renaming path → new_path", () => {
  const tool = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
    state: "call",
  } as ToolInvocation;
  expect(getToolLabel(tool)).toBe("Renaming /old.jsx → /new.jsx");
});

test("getToolLabel: file_manager delete returns Deleting path", () => {
  const tool = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { command: "delete", path: "/old.jsx" },
    state: "call",
  } as ToolInvocation;
  expect(getToolLabel(tool)).toBe("Deleting /old.jsx");
});

test("getToolLabel: unknown tool returns toolName", () => {
  const tool = {
    toolCallId: "1",
    toolName: "some_other_tool",
    args: {},
    state: "call",
  } as ToolInvocation;
  expect(getToolLabel(tool)).toBe("some_other_tool");
});

// --- ToolCallBadge rendering tests ---

test("ToolCallBadge shows spinner when state is call", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "call",
  } as ToolInvocation;

  const { container } = render(<ToolCallBadge toolInvocation={tool} />);

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  // Spinner has animate-spin class
  expect(container.querySelector(".animate-spin")).toBeDefined();
  // No green dot
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows green dot when state is result", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "result",
    result: "Success",
  } as ToolInvocation;

  const { container } = render(<ToolCallBadge toolInvocation={tool} />);

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  // Green dot
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  // No spinner
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge shows spinner when state is partial-call", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/App.jsx" },
    state: "partial-call",
  } as ToolInvocation;

  const { container } = render(<ToolCallBadge toolInvocation={tool} />);

  expect(screen.getByText("Editing /App.jsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("ToolCallBadge renders file_manager delete label", () => {
  const tool = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { command: "delete", path: "/Button.jsx" },
    state: "result",
    result: { success: true },
  } as ToolInvocation;

  render(<ToolCallBadge toolInvocation={tool} />);

  expect(screen.getByText("Deleting /Button.jsx")).toBeDefined();
});
