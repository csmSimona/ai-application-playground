# 新增应用开发指南

这份指南说明如何在当前 AI Application Playground 中新增一个应用。前端按业务区块拆分：

- `ai-playground.tsx`：入口控制器，维护状态、请求、表单提交和聊天历史
- `access-panel.tsx`：接入方式、API Key、Base URL、Model
- `tool-switcher.tsx`：应用切换
- `tool-workspace.tsx`：根据当前应用渲染对应的应用组件
- `app-shell.tsx`：应用通用布局、输入卡片、文本输出和聊天输出
- `constants.ts`：应用列表和接入方默认配置
- `payload.ts`：把表单数据转换为后端请求 payload，并格式化部分输出

每个应用组件放在 `app/_components/ai-playground/apps/`，只负责自己的输入表单和输出区域。请求、loading、错误、结果和聊天历史都由 `ai-playground.tsx` 统一管理。

后端统一在 `app/api/generate/route.ts` 中处理生成请求。当前项目使用 Vercel AI SDK 的 `generateText()` 调用模型，通过 `createOpenAI()` 和 `createAnthropic()` 分别适配 OpenAI 兼容接口与 Anthropic Messages API。

## 1. 增加应用 ID

修改 `app/_components/ai-playground/types.ts`，给 `ToolId` 增加新的应用 ID。

例如新增“标题生成器”：

```ts
export type ToolId = "video" | "xiaohongshu" | "chat" | "pdf" | "csv" | "title";
```

这个 ID 会贯穿前端切换、payload 构建和后端提示词分支，建议使用简短英文小写。

## 2. 添加应用切换入口

修改 `app/_components/ai-playground/constants.ts`，在 `tools` 数组里新增一项。

```ts
{ id: "title", name: "标题生成器", note: "生成多个标题备选" },
```

这里的：

- `id`：必须和 `ToolId` 中新增的值一致
- `name`：显示在应用切换按钮里
- `note`：显示在应用切换按钮的小字说明里

## 3. 创建应用组件

在 `app/_components/ai-playground/apps/` 下新增组件文件。普通一次性生成应用使用 `AppViewProps` 即可。

例如：

```tsx
// app/_components/ai-playground/apps/title-app.tsx
import { AppInputCard, AppLayout, TextOutputCard } from "../app-shell";
import type { AppViewProps } from "../types";

export default function TitleApp({
  error,
  isAccessReady,
  loading,
  onSubmit,
  result,
}: AppViewProps) {
  return (
    <AppLayout>
      <AppInputCard
        error={error}
        isAccessReady={isAccessReady}
        loading={loading}
        onSubmit={onSubmit}
        title="标题生成器"
      >
        <label className="grid gap-1">
          <span className="mini-label">主题</span>
          <input className="field" name="topic" placeholder="例如：AI 学习路线" required />
        </label>
      </AppInputCard>

      <TextOutputCard result={result} />
    </AppLayout>
  );
}
```

可复用的 UI 都从 `app-shell.tsx` 引入：

- `AppLayout`：输入和输出的两栏布局
- `AppInputCard`：输入卡片，内置标题、禁用状态、错误提示、提交按钮
- `TextOutputCard`：普通文本输出
- `ChatOutputCard`：聊天消息输出，仅聊天类应用需要

如果应用需要额外按钮，可以给 `AppInputCard` 传 `actions`：

```tsx
<AppInputCard
  actions={<button className="secondary-button" type="button">额外操作</button>}
  error={error}
  isAccessReady={isAccessReady}
  loading={loading}
  onSubmit={onSubmit}
  title="标题生成器"
>
```

## 4. 在 ToolWorkspace 中接入应用组件

修改 `app/_components/ai-playground/tool-workspace.tsx`。

1. 引入新应用组件：

```ts
import TitleApp from "./apps/title-app";
```

2. 在分支里返回新组件：

```tsx
if (activeTool === "title") {
  return <TitleApp {...appProps} />;
}
```

普通文本类应用一般直接使用 `appProps`。聊天类应用如果需要会话历史，可以参考 `ChatApp` 的写法，额外传入 `chatMessages` 和 `onClearChat`。

## 5. 构建前端 payload

修改 `app/_components/ai-playground/payload.ts`，在 `buildPayload` 中处理新应用表单字段。

```ts
if (tool === "title") {
  return {
    topic: text(form, "topic"),
  };
}
```

这里读取的字段名必须和应用组件里的 `name` 一致。

如果模型返回内容需要前端二次格式化，可以在 `formatResult` 中增加分支。

```ts
if (tool === "title") {
  return content;
}
```

多数应用直接返回 `content` 即可。

## 6. 接入后端生成逻辑

修改 `app/api/generate/route.ts`。

1. 给 `GenerateRequest.tool` 增加新应用 ID：

```ts
tool:
  | "video"
  | "xiaohongshu"
  | "chat"
  | "pdf"
  | "csv"
  | "drawGuess"
  | "colorPalette"
  | "title";
```

2. 在 `buildMessages` 中增加提示词分支：

```ts
if (body.tool === "title") {
  return [
    {
      role: "system",
      content: "你是一位中文标题策划。请给出 5 个清晰、有吸引力的标题。",
    },
    {
      role: "user",
      content: `主题：${stringValue(payload.topic)}`,
    },
  ];
}
```

后端会把这份统一的 `ChatMessage[]` 交给 `generateWithAISDK`，再根据用户选择的 `provider` 创建 OpenAI 或 Anthropic 模型实例，所以新增普通应用通常只需要补 `buildMessages`。

如果新应用需要视觉输入，可以参考 `drawGuess`：用户消息的 `content` 可以是文本和图片组成的数组。

```ts
{
  role: "user",
  content: [
    { type: "text", text: "请识别这张图片。" },
    { type: "image", image: imageDataUrl },
  ],
}
```

`image` 可以是 data URL，也可以是模型供应商支持的图片 URL。

## 7. 调整温度参数

如果新应用需要特殊创造力，可以在 `getTemperature` 里加分支。

例如标题类应用更发散：

```ts
if (body.tool === "title") {
  return 0.8;
}
```

如果不加分支，会使用默认逻辑。

## 8. 聊天类应用的特殊情况

当前 `ai-playground.tsx` 里对 `activeTool === "chat"` 做了特殊处理，因为它需要：

- 从表单中读取 `prompt`
- 把用户消息加入 `chatMessages`
- 把历史消息传给后端
- 把模型回复追加到前端会话里

如果新增的应用也是多轮聊天类应用，需要在 `handleGenerate` 中增加类似分支。普通一次性生成应用不需要改这里。

## 9. 验证

新增应用后运行：

```bash
npm run build
```

建议手动检查：

- 未填写接入信息时，应用切换和表单是否禁用
- 填写接入信息后，新应用是否能切换
- 表单字段是否能正确提交
- OpenAI 和 Anthropic 两种接入是否都能走到后端
- 输出区域是否符合预期

如果改到了后端模型调用、类型定义或依赖，建议同时运行：

```bash
npm run lint
npm run build
```

## 最小改动清单

新增一个普通文本生成应用，通常需要改这些文件：

- `app/_components/ai-playground/types.ts`
- `app/_components/ai-playground/constants.ts`
- `app/_components/ai-playground/apps/<your-app>.tsx`
- `app/_components/ai-playground/tool-workspace.tsx`
- `app/_components/ai-playground/payload.ts`
- `app/api/generate/route.ts`

如果应用只是一次性输入、一次性输出，不需要改 `ai-playground.tsx`。
