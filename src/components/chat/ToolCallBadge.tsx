"use client";

import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

export function getToolLabel(tool: ToolInvocation): string {
  const args = tool.args as Record<string, unknown>;

  if (tool.toolName === "str_replace_editor") {
    const command = args?.command as string | undefined;
    const path = args?.path as string | undefined;

    switch (command) {
      case "create":
        return path ? `Creating ${path}` : "Creating file";
      case "str_replace":
      case "insert":
        return path ? `Editing ${path}` : "Editing file";
      case "view":
        return path ? `Viewing ${path}` : "Viewing file";
      case "undo_edit":
        return path ? `Undoing edit in ${path}` : "Undoing edit";
      default:
        return path ? `Editing ${path}` : "Editing file";
    }
  }

  if (tool.toolName === "file_manager") {
    const command = args?.command as string | undefined;
    const path = args?.path as string | undefined;
    const newPath = args?.new_path as string | undefined;

    switch (command) {
      case "rename":
        return path && newPath
          ? `Renaming ${path} → ${newPath}`
          : path
          ? `Renaming ${path}`
          : "Renaming file";
      case "delete":
        return path ? `Deleting ${path}` : "Deleting file";
      default:
        return path ? `Managing ${path}` : "Managing file";
    }
  }

  return tool.toolName;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const label = getToolLabel(toolInvocation);
  const isComplete =
    toolInvocation.state === "result" && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
