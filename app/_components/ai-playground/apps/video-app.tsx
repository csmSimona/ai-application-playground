import { AppInputCard, AppLayout, TextOutputCard } from "../app-shell";
import type { AppViewProps } from "../types";

export default function VideoApp({
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
        title="视频脚本"
      >
        <label className="grid gap-1">
          <span className="mini-label">视频主题</span>
          <input className="field" name="subject" placeholder="例如：Sora 模型" required />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="mini-label">时长/分钟</span>
            <input
              className="field"
              defaultValue="1"
              min="0.1"
              name="duration"
              step="0.1"
              type="number"
            />
          </label>
          <label className="grid gap-1">
            <span className="mini-label">创造力</span>
            <input
              className="field"
              defaultValue="0.7"
              max="1"
              min="0"
              name="creativity"
              step="0.1"
              type="number"
            />
          </label>
        </div>
        <label className="grid gap-1">
          <span className="mini-label">参考资料</span>
          <textarea
            className="field min-h-28"
            name="reference"
            placeholder="可粘贴维基百科、新闻或课程资料。"
          />
        </label>
      </AppInputCard>

      <TextOutputCard result={result} />
    </AppLayout>
  );
}
