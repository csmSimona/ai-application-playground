import { AppInputCard, AppLayout, TextOutputCard } from "../app-shell";
import type { AppViewProps } from "../types";

export default function CsvApp({
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
        title="CSV分析"
      >
        <label className="grid gap-1">
          <span className="mini-label">CSV内容</span>
          <textarea
            className="field min-h-44"
            name="csv"
            placeholder={"name,score\\nAlice,92\\nBob,86"}
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="mini-label">分析问题</span>
          <textarea
            className="field min-h-28"
            name="query"
            placeholder="请找出分数最高的人，或生成适合的条形图数据。"
            required
          />
        </label>
      </AppInputCard>

      <TextOutputCard result={result} />
    </AppLayout>
  );
}
