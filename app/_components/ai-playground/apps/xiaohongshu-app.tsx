import { AppInputCard, AppLayout, TextOutputCard } from "../app-shell";
import type { AppViewProps } from "../types";

export default function XiaohongshuApp({
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
        title="小红书文案"
      >
        <label className="grid gap-1">
          <span className="mini-label">创作主题</span>
          <input className="field" name="theme" placeholder="例如：春天通勤穿搭" required />
        </label>
      </AppInputCard>

      <TextOutputCard result={result} />
    </AppLayout>
  );
}
