type GenerateRequest = {
  tool: "video" | "xiaohongshu" | "chat" | "pdf" | "csv";
  provider?: "openai" | "anthropic";
  apiKey: string;
  baseUrl?: string;
  model?: string;
  payload: Record<string, unknown>;
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const PROVIDER_DEFAULTS = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-5.4-mini",
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-sonnet-4-6",
  },
} as const;

const ANTHROPIC_VERSION = "2023-06-01";
const ANTHROPIC_MAX_TOKENS = 2000;

// 较长的系统提示词放在服务端，集中约束各应用的生成行为。
const xiaohongshuSystem = `你是小红书爆款写作专家。请先产出5个标题，每个标题20个字以内，并包含适当emoji。再产出1段800字以内正文，正文要包含emoji和tag标签。
标题技巧：使用二极管标题法、紧迫感、惊喜感、具体效果、口语化表达，并从这些关键词中自然选择1-2个：好用到哭、大数据、小白必看、宝藏、神器、都给我冲、划重点、建议收藏、停止摆烂、手把手、揭秘、普通女生、治愈、万万没想到、被夸爆。
正文风格从严肃、幽默、愉快、激动、温馨、轻松、热情、鼓励、建议、真诚、亲切中选择一种。
只返回JSON：{"titles":["标题1","标题2","标题3","标题4","标题5"],"content":"正文"}`;

const csvSystem = `你是一位数据分析助手。用户会给你CSV列名、少量样本和问题。请直接回答，必要时返回一个JSON对象。
如果是文字回答，格式为 {"answer":"..."}。
如果需要表格，格式为 {"table":{"columns":["column1"],"data":[["value"]]}}。
如果适合可视化，只能使用 {"bar":...}、{"line":...} 或 {"scatter":...}，每个图表对象都包含 columns 和 data。
不要编造样本中不存在的精确结论；如果样本不足，说明需要完整CSV。`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const provider = body.provider === "anthropic" ? "anthropic" : "openai";

    if (!body.apiKey?.trim()) {
      const name = provider === "anthropic" ? "Anthropic" : "OpenAI";
      return Response.json({ error: `请输入 ${name} API 密钥。` }, { status: 400 });
    }

    const baseUrl = normalizeBaseUrl(body.baseUrl, provider);
    const model = body.model?.trim() || PROVIDER_DEFAULTS[provider].model;
    const messages = buildMessages(body);
    const temperature = getTemperature(body);

    // 前端保持统一请求格式，后端在这里适配不同供应商的接口结构。
    const content =
      provider === "anthropic"
        ? await generateWithAnthropic({
            apiKey: body.apiKey,
            baseUrl,
            messages,
            model,
            temperature,
          })
        : await generateWithOpenAI({
            apiKey: body.apiKey,
            baseUrl,
            messages,
            model,
            temperature,
          });

    return Response.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "请求处理失败。";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function generateWithOpenAI({
  apiKey,
  baseUrl,
  messages,
  model,
  temperature,
}: {
  apiKey: string;
  baseUrl: string;
  messages: ChatMessage[];
  model: string;
  temperature: number;
}) {
  // GPT-5 系列不接受部分旧 Chat Completions 参数，例如 temperature。
  const requestBody = {
    model,
    messages,
    ...(!model.startsWith("gpt-5") ? { temperature } : {}),
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || `OpenAI 接口返回 ${response.status}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("模型没有返回内容。");
  }

  return content;
}

async function generateWithAnthropic({
  apiKey,
  baseUrl,
  messages,
  model,
  temperature,
}: {
  apiKey: string;
  baseUrl: string;
  messages: ChatMessage[];
  model: string;
  temperature: number;
}) {
  // Anthropic Messages API 要求 system 指令和对话消息分开放置。
  const { system, conversation } = toAnthropicMessages(messages);
  const response = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": ANTHROPIC_VERSION,
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      system,
      messages: conversation,
      temperature,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || `Anthropic 接口返回 ${response.status}`);
  }

  const content = data?.content
    ?.filter((item: { type?: string; text?: string }) => item.type === "text")
    .map((item: { text?: string }) => item.text || "")
    .join("");

  if (!content) {
    throw new Error("模型没有返回内容。");
  }

  return content;
}

function normalizeBaseUrl(baseUrl: string | undefined, provider: "openai" | "anthropic") {
  const trimmed = baseUrl?.trim() || PROVIDER_DEFAULTS[provider].baseUrl;
  return trimmed.replace(/\/+$/, "");
}

function getTemperature(body: GenerateRequest) {
  if (body.tool === "csv") {
    // 数据分析尽量保持确定性。
    return 0;
  }

  const value = body.payload.creativity;
  if (typeof value === "number") {
    return Math.min(Math.max(value, 0), 1);
  }
  return body.tool === "xiaohongshu" ? 0.8 : 0.7;
}

function buildMessages(body: GenerateRequest): ChatMessage[] {
  const payload = body.payload;

  // 先构造一份供应商无关的消息列表，再分别适配 OpenAI 或 Anthropic。
  if (body.tool === "video") {
    return [
      {
        role: "system",
        content:
          "你是一位短视频频道策划。输出必须包含【标题】和【脚本】，脚本按【开头】【中间】【结尾】分隔，表达轻松有趣。",
      },
      {
        role: "user",
        content: `主题：${stringValue(payload.subject)}
视频时长：${stringValue(payload.duration)}分钟
参考资料：${stringValue(payload.reference) || "无"}
请为这个主题生成吸引人的标题和短视频脚本。`,
      },
    ];
  }

  if (body.tool === "xiaohongshu") {
    return [
      { role: "system", content: xiaohongshuSystem },
      { role: "user", content: `主题：${stringValue(payload.theme)}` },
    ];
  }

  if (body.tool === "chat") {
    const history = Array.isArray(payload.history) ? payload.history : [];
    return [
      { role: "system", content: "你是一个清晰、友好、有耐心的中文 AI 助手。" },
      ...history
        .filter(isMessage)
        .slice(-12)
        .map((message) => ({ role: message.role, content: message.content })),
      { role: "user", content: stringValue(payload.prompt) },
    ];
  }

  if (body.tool === "pdf") {
    return [
      {
        role: "system",
        content:
          "你是PDF文档问答助手。只基于用户提供的文档文本回答；如果文本里没有答案，请明确说明。",
      },
      {
        role: "user",
        content: `文档名称：${stringValue(payload.fileName) || "未命名文档"}
文档文本：
${stringValue(payload.documentText)}

问题：${stringValue(payload.question)}`,
      },
    ];
  }

  return [
    { role: "system", content: csvSystem },
    {
      role: "user",
      content: `列名：${stringValue(payload.columns)}
样本：
${stringValue(payload.sample)}

用户问题：${stringValue(payload.query)}`,
    },
  ];
}

function toAnthropicMessages(messages: ChatMessage[]) {
  // Anthropic 不接受 messages 中的 system 角色，需要汇总到顶层 system 字段。
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");

  const conversation = messages
    .filter((message) => message.role !== "system")
    .filter((message, index) => index > 0 || message.role === "user")
    .map((message) => ({ role: message.role, content: message.content }));

  return {
    system,
    conversation: conversation.length
      ? conversation
      : [{ role: "user" as const, content: "请继续。" }],
  };
}

function stringValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value == null) {
    return "";
  }

  return JSON.stringify(value);
}

function isMessage(value: unknown): value is { role: "user" | "assistant"; content: string } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as { role?: unknown; content?: unknown };
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  );
}
