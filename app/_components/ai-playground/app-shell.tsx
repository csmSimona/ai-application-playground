import type { FormEvent, ReactNode } from "react";
import type { Message } from "./types";

type AppInputCardProps = {
  actions?: ReactNode;
  children: ReactNode;
  error: string;
  isAccessReady: boolean;
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
};

export function AppLayout({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">{children}</div>;
}

export function AppInputCard({
  actions,
  children,
  error,
  isAccessReady,
  loading,
  onSubmit,
  title,
}: AppInputCardProps) {
  return (
    <form className="panel p-5 sm:p-6" onSubmit={onSubmit}>
      <p className="mini-label">当前工具</p>
      <h2 className="mt-2 font-serif text-4xl leading-tight tracking-normal">{title}</h2>
      <fieldset className="tool-fieldset mt-6 grid gap-4" disabled={!isAccessReady}>
        {children}
      </fieldset>
      {error ? (
        <p className="mt-4 rounded-[8px] border border-[var(--accent-warm)] bg-[#fff1ed] p-3 font-semibold text-[var(--accent-warm)]">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="primary-button" disabled={loading || !isAccessReady} type="submit">
          {loading ? "生成中..." : isAccessReady ? "开始生成" : "先填写接入信息"}
        </button>
        {actions}
      </div>
    </form>
  );
}

export function TextOutputCard({ result }: { result: string }) {
  return (
    <section className="panel p-5 sm:p-6">
      <p className="mini-label">输出</p>
      <div className="result-box mt-4 leading-7">{result || "结果会出现在这里。"}</div>
    </section>
  );
}

export function ChatOutputCard({ messages }: { messages: Message[] }) {
  return (
    <section className="panel p-5 sm:p-6">
      <p className="mini-label">输出</p>
      <div className="mt-4 grid max-h-[34rem] gap-3 overflow-auto pr-1">
        {messages.map((message, index) => (
          <div
            className={
              message.role === "user"
                ? "ml-8 rounded-[8px] border border-black/20 bg-[var(--panel-strong)] p-3"
                : "mr-8 rounded-[8px] border border-black/20 bg-white p-3"
            }
            key={`${message.role}-${index}`}
          >
            <p className="mini-label">{message.role === "user" ? "你" : "AI"}</p>
            <p className="mt-1 whitespace-pre-wrap leading-7">{message.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
