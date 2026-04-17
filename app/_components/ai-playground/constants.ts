import type { Provider, ToolId } from "./types";

export const tools: Array<{ id: ToolId; name: string; note: string }> = [
  { id: "video", name: "视频脚本", note: "标题、开头、中间、结尾" },
  { id: "xiaohongshu", name: "小红书文案", note: "5个标题和正文" },
  { id: "chat", name: "聊天助手", note: "带前端会话记忆" },
  { id: "pdf", name: "PDF问答", note: "基于粘贴文本回答" },
  { id: "csv", name: "CSV分析", note: "读取列名和样本" },
  { id: "drawGuess", name: "你画我猜", note: "画布作画，AI猜图" },
];

export const providerOptions: Array<{ id: Provider; name: string; note: string }> = [
  { id: "openai", name: "OpenAI", note: "兼容 Chat Completions" },
  { id: "anthropic", name: "Anthropic", note: "Claude Messages API" },
];

export const providerDefaults = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    keyPlaceholder: "sk-...",
    model: "gpt-5.4-mini",
  },
  anthropic: {
    baseUrl: "https://api.minimaxi.com/anthropic",
    keyPlaceholder: "sk-ant-...",
    model: "MiniMax-M2.7",
  },
} as const;
