import { tools } from "./constants";
import type { ToolId } from "./types";

type ToolSwitcherProps = {
  activeTool: ToolId;
  disabled: boolean;
  onToolChange: (tool: ToolId) => void;
};

export default function ToolSwitcher({
  activeTool,
  disabled,
  onToolChange,
}: ToolSwitcherProps) {
  return (
    <section className="panel p-4 sm:p-5">
      <p className="mini-label">应用切换</p>
      <div className="tool-switcher mt-3">
        {tools.map((tool) => (
          <button
            className="tab-button"
            data-active={tool.id === activeTool}
            disabled={disabled}
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            type="button"
          >
            <span className="block">{tool.name}</span>
            <span className="mt-1 block text-sm font-semibold opacity-70">{tool.note}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
