import type { FormEvent } from "react";

export type ToolId =
  | "video"
  | "xiaohongshu"
  | "chat"
  | "pdf"
  | "csv"
  | "drawGuess"
  | "colorPalette";

export type Provider = "openai" | "anthropic";

export type Message = { role: "user" | "assistant"; content: string };

export type AppViewProps = {
  error: string;
  isAccessReady: boolean;
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  result: string;
};

export type ChatAppViewProps = AppViewProps & {
  chatMessages: Message[];
  onClearChat: () => void;
};
