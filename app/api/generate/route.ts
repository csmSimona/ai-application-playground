import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type LanguageModel, type ModelMessage } from "ai";

type GenerateRequest = {
  tool: "video" | "xiaohongshu" | "chat" | "pdf" | "csv" | "drawGuess" | "colorPalette";
  provider?: "openai" | "anthropic";
  apiKey: string;
  baseUrl?: string;
  model?: string;
  payload: Record<string, unknown>;
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: MessageContent;
};

type MessageContent = string | AiContentBlock[];

type AiContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; image: string };

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

const colorPaletteSystem = `你是一位资深品牌配色设计师。请根据用户描述生成一套可直接用于界面设计的配色方案。
只返回JSON，不要使用Markdown代码块，不要添加解释。格式必须是：
{
  "name": "方案名称",
  "mood": "一句话说明情绪和使用场景",
  "colors": [
    { "value": "#123456", "name": "颜色名称", "role": "主色", "description": "直接说明这个颜色适合用在哪里" }
  ]
}
要求：
1. colors 数量必须等于用户要求的颜色数量。
2. value 必须使用用户要求的颜色格式：HEX、RGB 或 HSL。
3. 配色要和谐，避免只给同一色相的深浅变化。
4. role 从主色、辅助色、背景色、文本色、强调色、成功色、警示色中选择。
5. description 不超过22个中文字符，用具体场景描述，不要写泛泛的色彩理论。`;

// 处理前端统一生成请求，完成参数校验、消息构造和模型调用。
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

    const content = await generateWithAISDK({
      apiKey: body.apiKey,
      baseUrl,
      messages,
      model,
      provider,
      temperature,
    });

    return Response.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "请求处理失败。";
    return Response.json({ error: message }, { status: 500 });
  }
}

// 使用 Vercel AI SDK 调用指定供应商模型，并返回纯文本生成结果。
async function generateWithAISDK({
  apiKey,
  baseUrl,
  messages,
  model,
  provider,
  temperature,
}: {
  apiKey: string;
  baseUrl: string;
  messages: ChatMessage[];
  model: string;
  provider: "openai" | "anthropic";
  temperature: number;
}) {
  const languageModel = createLanguageModel({ apiKey, baseUrl, model, provider });
  const shouldSkipTemperature = provider === "openai" && model.startsWith("gpt-5");
  const response = await generateText({
    maxRetries: 1,
    messages: messages as ModelMessage[],
    model: languageModel,
    ...(provider === "anthropic" ? { maxOutputTokens: ANTHROPIC_MAX_TOKENS } : {}),
    ...(!shouldSkipTemperature ? { temperature } : {}),
  });
  const content = response.text.trim();

  if (!content) {
    throw new Error("模型没有返回内容。");
  }

  return content;
}

// 根据用户选择的供应商、Base URL 和模型名创建 AI SDK 语言模型实例。
function createLanguageModel({
  apiKey,
  baseUrl,
  model,
  provider,
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: "openai" | "anthropic";
}): LanguageModel {
  if (provider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey,
      baseURL: baseUrl,
    });

    return anthropic(model);
  }

  const openai = createOpenAI({
    apiKey,
    baseURL: baseUrl,
  });

  // 继续走 Chat Completions，兼容当前 UI 里强调的 OpenAI-compatible Base URL。
  return openai.chat(model);
}

// 规范化 Base URL，空值使用供应商默认地址，并移除末尾斜杠。
function normalizeBaseUrl(baseUrl: string | undefined, provider: "openai" | "anthropic") {
  const trimmed = baseUrl?.trim() || PROVIDER_DEFAULTS[provider].baseUrl;
  return trimmed.replace(/\/+$/, "");
}

// 根据当前应用场景选择采样温度，分析类任务更稳定，创作类任务更发散。
function getTemperature(body: GenerateRequest) {
  if (body.tool === "csv" || body.tool === "drawGuess") {
    // 分析和猜图都尽量保持稳定。
    return 0;
  }
  if (body.tool === "colorPalette") {
    return 0.72;
  }

  const value = body.payload.creativity;
  if (typeof value === "number") {
    return Math.min(Math.max(value, 0), 1);
  }
  return body.tool === "xiaohongshu" ? 0.8 : 0.7;
}

// 将不同应用的结构化 payload 转换为模型可理解的聊天消息列表。
function buildMessages(body: GenerateRequest): ChatMessage[] {
  const payload = body.payload;

  // 先构造一份供应商无关的消息列表，再分别适配 OpenAI 或 Anthropic。
  if (body.tool === "drawGuess") {
    const imageDataUrl = stringValue(payload.imageDataUrl);

    if (!imageDataUrl) {
      throw new Error("缺少画板图片，请先画一笔再让 AI 猜。");
    }

    return [
      {
        role: "system",
        content:
          "你正在玩中文你画我猜。请根据用户绘画内容进行简短猜测，只返回一句中文猜测，不要解释，不要列举多个答案。",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "请猜这张手绘图画的是什么。",
          },
          {
            type: "image",
            image: imageDataUrl,
          },
        ],
      },
    ];
  }

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

  if (body.tool === "colorPalette") {
    const count = clampNumber(numberValue(payload.colorCount), 3, 8, 5);
    const format = normalizeColorFormat(stringValue(payload.colorFormat));
    const prompt = stringValue(payload.prompt);

    if (!prompt.trim()) {
      throw new Error("请输入配色描述。");
    }

    return [
      { role: "system", content: colorPaletteSystem },
      {
        role: "user",
        content: `描述：${prompt}
颜色数量：${count}
颜色格式：${format}
偏好风格：${stringValue(payload.style) || "由你根据描述判断"}
请生成一套名为“配色助手”的配色方案。`,
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

// 将未知类型安全转成字符串，便于拼接进提示词。
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

// 将未知类型解析为有限数字，解析失败时返回 undefined。
function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

// 将数字限制在指定范围内，缺失时使用默认值。
function clampNumber(value: number | undefined, min: number, max: number, fallback: number) {
  if (value == null) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(value), min), max);
}

// 将用户输入的颜色格式统一成提示词里的标准写法。
function normalizeColorFormat(format: string) {
  const lower = format.toLowerCase();
  if (lower === "rgb") {
    return "RGB";
  }
  if (lower === "hsl") {
    return "HSL";
  }
  return "HEX";
}

// 校验聊天历史项，过滤掉非用户或助手消息。
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
