import type { ToolId } from "./types";

// 将各应用的表单字段转换成 /api/generate 共用的请求 payload。
export function buildPayload(tool: ToolId, form: FormData) {
  if (tool === "video") {
    return {
      subject: text(form, "subject"),
      duration: text(form, "duration"),
      creativity: Number(text(form, "creativity") || 0.7),
      reference: text(form, "reference"),
    };
  }

  if (tool === "xiaohongshu") {
    return { theme: text(form, "theme") };
  }

  if (tool === "pdf") {
    return {
      fileName: text(form, "fileName"),
      documentText: text(form, "documentText"),
      question: text(form, "question"),
    };
  }

  if (tool === "chat") {
    return { prompt: text(form, "prompt") };
  }

  if (tool === "drawGuess") {
    return { imageDataUrl: text(form, "imageDataUrl") };
  }

  const csv = text(form, "csv");
  const rows = parseCsvRows(csv);
  // 这里只发送少量样本给模型；当前 UI 是轻量工作台，不是完整 CSV 引擎。
  return {
    columns: rows[0] ?? [],
    sample: rows.slice(1, 21),
    query: text(form, "query"),
  };
}

export function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function formatResult(tool: ToolId, content: string) {
  if (tool !== "xiaohongshu") {
    return content;
  }

  try {
    // 小红书应用要求模型返回 JSON，再在前端整理成更易读的文本。
    const parsed = JSON.parse(content) as { titles?: string[]; content?: string };
    const titles = parsed.titles?.map((title, index) => `${index + 1}. ${title}`).join("\n");
    return `小红书标题\n${titles || content}\n\n小红书正文\n${parsed.content || ""}`;
  } catch {
    return content;
  }
}

function parseCsvRows(csv: string) {
  return csv
    .split(/\r?\n/)
    .filter(Boolean)
    .map((row) => row.split(",").map((cell) => cell.trim()));
}
