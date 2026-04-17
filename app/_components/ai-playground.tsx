"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import AccessPanel from "./ai-playground/access-panel";
import { providerDefaults } from "./ai-playground/constants";
import { buildPayload, formatResult, text } from "./ai-playground/payload";
import ToolSwitcher from "./ai-playground/tool-switcher";
import ToolWorkspace from "./ai-playground/tool-workspace";
import type { Message, Provider, ToolId } from "./ai-playground/types";

export default function AiPlayground() {
  const [activeTool, setActiveTool] = useState<ToolId>("video");
  const [provider, setProvider] = useState<Provider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState<string>(providerDefaults.openai.baseUrl);
  const [model, setModel] = useState<string>(providerDefaults.openai.model);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: "assistant", content: "你好，我是你的 AI 助手，有什么可以帮你的吗？" },
  ]);

  const isAccessReady = Boolean(apiKey.trim() && baseUrl.trim() && model.trim());

  function handleProviderChange(nextProvider: Provider) {
    // 切换接入方时同步重置默认地址和模型，避免 OpenAI / Anthropic 配置串用。
    setProvider(nextProvider);
    setBaseUrl(providerDefaults[nextProvider].baseUrl);
    setModel(providerDefaults[nextProvider].model);
    setError("");
    setResult("");
  }

  function handleToolChange(nextTool: ToolId) {
    setActiveTool(nextTool);
    setError("");
    setResult("");
  }

  function handleClearChat() {
    setChatMessages([
      {
        role: "assistant",
        content: "你好，我是你的 AI 助手，有什么可以帮你的吗？",
      },
    ]);
    setResult("");
  }

  async function generate(payload: Record<string, unknown>) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: activeTool,
          provider,
          apiKey,
          baseUrl,
          model,
          payload,
        }),
      });
      const data = (await response.json()) as { content?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "生成失败");
      }

      return data.content || "";
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAccessReady) {
      setError("请先填写接入方式、API Key、Base URL 和 Model。");
      return;
    }

    const form = new FormData(event.currentTarget);

    try {
      // 聊天应用需要维护前端会话历史，其他应用只提交一次性的表单 payload。
      if (activeTool === "chat") {
        const prompt = text(form, "prompt");
        if (!prompt) {
          setError("请输入你的问题。");
          return;
        }

        const nextMessages: Message[] = [...chatMessages, { role: "user", content: prompt }];
        setChatMessages(nextMessages);
        const content = await generate({ prompt, history: chatMessages });
        setChatMessages([...nextMessages, { role: "assistant", content }]);
        setResult(content);
        event.currentTarget.reset();
        return;
      }

      const payload = buildPayload(activeTool, form);
      const content = await generate(payload);
      setResult(formatResult(activeTool, content));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "生成失败");
    }
  }

  return (
    <section className="px-5 py-10 sm:px-8 lg:px-10" id="playground">
      <div className="mx-auto grid max-w-7xl gap-6">
        <AccessPanel
          apiKey={apiKey}
          baseUrl={baseUrl}
          isAccessReady={isAccessReady}
          model={model}
          onApiKeyChange={setApiKey}
          onBaseUrlChange={setBaseUrl}
          onModelChange={setModel}
          onProviderChange={handleProviderChange}
          provider={provider}
        />

        <ToolSwitcher
          activeTool={activeTool}
          disabled={!isAccessReady}
          onToolChange={handleToolChange}
        />

        <ToolWorkspace
          activeTool={activeTool}
          chatMessages={chatMessages}
          error={error}
          isAccessReady={isAccessReady}
          loading={loading}
          onClearChat={handleClearChat}
          onSubmit={handleGenerate}
          result={result}
        />
      </div>
    </section>
  );
}
