import { AppInputCard, AppLayout, TextOutputCard } from "../app-shell";
import type { AppViewProps } from "../types";

export default function PdfApp({
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
        title="PDF问答"
      >
        <label className="grid gap-1">
          <span className="mini-label">PDF文件名</span>
          <input className="field" name="fileName" placeholder="例如：课程讲义.pdf" />
        </label>
        <label className="grid gap-1">
          <span className="mini-label">PDF文本</span>
          <textarea
            className="field min-h-44"
            name="documentText"
            placeholder="请从 PDF 中复制文本粘贴到这里。"
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="mini-label">问题</span>
          <input
            className="field"
            name="question"
            placeholder="这份文档的核心结论是什么？"
            required
          />
        </label>
      </AppInputCard>

      <TextOutputCard result={result} />
    </AppLayout>
  );
}
