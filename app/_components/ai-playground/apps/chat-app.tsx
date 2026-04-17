import { AppInputCard, AppLayout, ChatOutputCard } from "../app-shell";
import type { ChatAppViewProps } from "../types";

export default function ChatApp({
  chatMessages,
  error,
  isAccessReady,
  loading,
  onClearChat,
  onSubmit,
}: ChatAppViewProps) {
  return (
    <AppLayout>
      <AppInputCard
        actions={
          <button className="secondary-button" onClick={onClearChat} type="button">
            清空对话
          </button>
        }
        error={error}
        isAccessReady={isAccessReady}
        loading={loading}
        onSubmit={onSubmit}
        title="聊天助手"
      >
        <label className="grid gap-1">
          <span className="mini-label">你的问题</span>
          <textarea className="field min-h-36" name="prompt" placeholder="请输入你的问题" />
        </label>
      </AppInputCard>

      <ChatOutputCard messages={chatMessages} />
    </AppLayout>
  );
}
