# AI Application Playground

一个基于 Next.js 的 AI 应用练习场，用来快速体验不同类型的 AI 应用形态。当前使用 Vercel AI SDK 接入模型，支持 OpenAI 兼容 Chat Completions 接口和 Anthropic Messages API。API Key、Base URL、Model 都在页面中手动填写，不写入服务端环境变量。

## 功能

当前内置 7 个应用：

- 视频脚本：根据主题、时长、创造力和参考资料生成短视频标题与脚本
- 小红书文案：根据主题生成 5 个标题和一段正文
- 聊天助手：支持前端会话历史的多轮聊天
- PDF 问答：粘贴 PDF 文本后基于文档回答问题
- CSV 分析：粘贴 CSV 内容和分析问题，生成文字、表格或图表数据建议
- 你画我猜：在画布中绘制简笔画，让支持视觉输入的模型猜测内容
- 配色助手：根据描述生成可用于界面设计的配色方案

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Vercel AI SDK

## 本地运行

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

打开：

```txt
http://localhost:3000
```

生产构建：

```bash
npm run build
```

启动生产服务：

```bash
npm run start
```

代码检查：

```bash
npm run lint
```

## 使用方式

1. 打开首页后，在“接入方式”中选择 `OpenAI` 或 `Anthropic`。
2. 填写 API Key、Base URL 和 Model。
3. 切换到想使用的应用。
4. 填写应用表单并点击“开始生成”。

默认接入配置：

| 接入方 | 默认 Base URL | 默认 Model |
| --- | --- | --- |
| OpenAI | `https://api.openai.com/v1` | `gpt-5.4-mini` |
| Anthropic | `https://api.minimaxi.com/anthropic` | `MiniMax-M2.7` |

如果你使用的是兼容 OpenAI Chat Completions 的代理或网关，可以把 Base URL 改成自己的地址。

## 项目结构

```txt
app/
  page.tsx
  globals.css
  api/
    generate/
      route.ts
  _components/
    ai-playground.tsx
    ai-playground/
      access-panel.tsx
      app-shell.tsx
      constants.ts
      payload.ts
      tool-switcher.tsx
      tool-workspace.tsx
      types.ts
      apps/
        video-app.tsx
        xiaohongshu-app.tsx
        chat-app.tsx
        pdf-app.tsx
        csv-app.tsx
        draw-guess-app.tsx
        color-palette-app.tsx
docs/
  add-app-guide.md
```

核心职责：

- `app/_components/ai-playground.tsx`：页面入口控制器，维护状态、请求、提交、错误和聊天历史
- `app/_components/ai-playground/access-panel.tsx`：接入配置表单
- `app/_components/ai-playground/tool-switcher.tsx`：应用切换
- `app/_components/ai-playground/tool-workspace.tsx`：根据当前应用渲染对应组件
- `app/_components/ai-playground/app-shell.tsx`：应用通用布局、输入卡片和输出区域
- `app/_components/ai-playground/payload.ts`：把前端表单转换为后端请求 payload
- `app/api/generate/route.ts`：统一生成接口，使用 Vercel AI SDK 适配 OpenAI 和 Anthropic

## 生成接口

前端统一请求：

```txt
POST /api/generate
```

请求体包含：

- `tool`：当前应用 ID
- `provider`：`openai` 或 `anthropic`
- `apiKey`：用户填写的 API Key
- `baseUrl`：用户填写的 Base URL
- `model`：用户填写的模型名
- `payload`：当前应用表单转换后的结构化数据

后端会根据 `provider` 创建对应的 AI SDK provider：

- OpenAI：使用 `createOpenAI()` 和 `openai.chat(model)`，继续兼容 OpenAI Chat Completions 风格的 Base URL
- Anthropic：使用 `createAnthropic()` 和 `anthropic(model)`，接入 Anthropic Messages API

不同应用的提示词统一在 `buildMessages` 中构造，最终由 `generateText()` 生成文本结果。
