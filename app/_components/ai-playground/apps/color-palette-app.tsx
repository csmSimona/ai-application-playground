import type { CSSProperties } from "react";
import { useMemo } from "react";
import { AppInputCard, AppLayout } from "../app-shell";
import type { AppViewProps } from "../types";

type PaletteColor = {
  description?: string;
  name?: string;
  role?: string;
  value?: string;
};

type PaletteResult = {
  colors?: PaletteColor[];
  mood?: string;
  name?: string;
  usage?: string[];
};

const starterColors = [
  { description: "用于主要按钮和关键状态", name: "主色", role: "Primary", value: "#0d8b72" },
  { description: "用于页面底色和大面积留白", name: "纸面", role: "Surface", value: "#fffdf7" },
  { description: "用于提示、标签和高光", name: "强调", role: "Accent", value: "#c3422f" },
  { description: "用于正文和标题", name: "墨色", role: "Text", value: "#1b1a17" },
  { description: "用于轻提示和辅助背景", name: "浅雾", role: "Tint", value: "#e7f2ec" },
];

type ColorSwatchStyle = CSSProperties & {
  "--swatch": string;
  "--swatch-ink": string;
};

export default function ColorPaletteApp({
  error,
  isAccessReady,
  loading,
  onSubmit,
  result,
}: AppViewProps) {
  const palette = useMemo(() => parsePaletteResult(result), [result]);
  const colors = palette?.colors?.filter((color) => color.value) ?? starterColors;

  return (
    <AppLayout className="xl:grid-cols-[0.8fr_1.2fr]">
      <AppInputCard
        error={error}
        isAccessReady={isAccessReady}
        loading={loading}
        onSubmit={onSubmit}
        title="配色助手"
      >
        <label className="grid gap-1">
          <span className="mini-label">配色描述</span>
          <textarea
            className="field min-h-32"
            name="prompt"
            placeholder="例如：适合独立咖啡品牌的秋季菜单，温暖但不甜腻。"
            required
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="mini-label">颜色数量</span>
            <select className="field" defaultValue="5" name="colorCount">
              <option value="3">3 个颜色</option>
              <option value="4">4 个颜色</option>
              <option value="5">5 个颜色</option>
              <option value="6">6 个颜色</option>
              <option value="8">8 个颜色</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="mini-label">颜色格式</span>
            <select className="field" defaultValue="hex" name="colorFormat">
              <option value="hex">HEX</option>
              <option value="rgb">RGB</option>
              <option value="hsl">HSL</option>
            </select>
          </label>
        </div>
        <label className="grid gap-1">
          <span className="mini-label">偏好风格</span>
          <input
            className="field"
            name="style"
            placeholder="可选：品牌感、网页 UI、海报、极简、活泼、复古..."
          />
        </label>
      </AppInputCard>

      <section className="panel color-assistant p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mini-label">配色预览</p>
            <h2 className="mt-2 font-serif text-4xl leading-tight tracking-normal">
              {palette?.name || "先给我一个画面"}
            </h2>
          </div>
          <span className="color-count">{colors.length} colors</span>
        </div>

        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          {palette?.mood || "描述一个品牌、空间、产品或情绪，我会生成可落地的色板。"}
        </p>

        <div className="color-strip mt-6">
          {colors.map((color, index) => (
            <div
              className="color-swatch"
              key={`${color.value}-${index}`}
              style={
                {
                  "--swatch": color.value,
                  "--swatch-ink": getReadableTextColor(color.value),
                } as ColorSwatchStyle
              }
            >
              <div className="color-swatch-top">
                <span>{color.role || "Color"}</span>
                <code>{color.value}</code>
              </div>
              <div className="color-swatch-copy">
                <h3>{color.name || `颜色 ${index + 1}`}</h3>
                <p>{color.description || "用于这一组配色的关键场景。"}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}

function parsePaletteResult(result: string): PaletteResult | null {
  if (!result.trim()) {
    return null;
  }

  try {
    const json = extractJson(result);
    return JSON.parse(json) as PaletteResult;
  } catch {
    return {
      mood: result,
      name: "配色助手",
      colors: starterColors,
      usage: ["模型返回了非 JSON 内容，已保留文字结果。可以换个模型或再生成一次。"],
    };
  }
}

function extractJson(value: string) {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const json = value.match(/\{[\s\S]*\}/);
  return json?.[0] ?? value;
}

function getReadableTextColor(color: string | undefined) {
  const rgb = parseColorToRgb(color);
  if (!rgb) {
    return "#1b1a17";
  }

  const [r, g, b] = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.48 ? "#1b1a17" : "#fffdf7";
}

function parseColorToRgb(color: string | undefined): [number, number, number] | null {
  if (!color) {
    return null;
  }

  const hex = color.trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hex) {
    return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
  }

  const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }

  const hsl = color.match(/hsla?\(([\d.]+),\s*([\d.]+)%?,\s*([\d.]+)%?/i);
  if (hsl) {
    return hslToRgb(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]));
  }

  return null;
}

function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const h = (((hue % 360) + 360) % 360) / 360;
  const s = Math.max(0, Math.min(100, saturation)) / 100;
  const l = Math.max(0, Math.min(100, lightness)) / 100;

  if (s === 0) {
    const value = Math.round(l * 255);
    return [value, value, value];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  ];
}

function hueToRgb(p: number, q: number, t: number) {
  let next = t;
  if (next < 0) {
    next += 1;
  }
  if (next > 1) {
    next -= 1;
  }
  if (next < 1 / 6) {
    return p + (q - p) * 6 * next;
  }
  if (next < 1 / 2) {
    return q;
  }
  if (next < 2 / 3) {
    return p + (q - p) * (2 / 3 - next) * 6;
  }
  return p;
}
