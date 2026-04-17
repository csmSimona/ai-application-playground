import { providerDefaults, providerOptions } from "./constants";
import type { Provider } from "./types";

type AccessPanelProps = {
  apiKey: string;
  baseUrl: string;
  isAccessReady: boolean;
  model: string;
  onApiKeyChange: (value: string) => void;
  onBaseUrlChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onProviderChange: (provider: Provider) => void;
  provider: Provider;
};

export default function AccessPanel({
  apiKey,
  baseUrl,
  isAccessReady,
  model,
  onApiKeyChange,
  onBaseUrlChange,
  onModelChange,
  onProviderChange,
  provider,
}: AccessPanelProps) {
  const providerMeta = providerDefaults[provider];

  return (
    <section className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-2">
          <p className="mini-label">接入方式</p>
          <div className="provider-toggle">
            {providerOptions.map((option) => (
              <button
                aria-pressed={option.id === provider}
                className="provider-option"
                data-active={option.id === provider}
                key={option.id}
                onClick={() => onProviderChange(option.id)}
                type="button"
              >
                <span>{option.name}</span>
                <span>{option.note}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="access-status" data-ready={isAccessReady}>
          {isAccessReady ? "接入信息已就绪" : "先完成接入信息，再开始生成"}
        </p>
      </div>

      <div className="access-grid mt-5">
        <label className="grid gap-1">
          <span className="mini-label">
            {provider === "anthropic" ? "Anthropic API Key" : "OpenAI API Key"}
          </span>
          <input
            className="field"
            onChange={(event) => onApiKeyChange(event.target.value)}
            placeholder={providerMeta.keyPlaceholder}
            type="password"
            value={apiKey}
          />
        </label>
        <label className="grid gap-1">
          <span className="mini-label">Base URL</span>
          <input
            className="field"
            onChange={(event) => onBaseUrlChange(event.target.value)}
            placeholder={providerMeta.baseUrl}
            value={baseUrl}
          />
        </label>
        <label className="grid gap-1">
          <span className="mini-label">Model</span>
          <input
            className="field"
            onChange={(event) => onModelChange(event.target.value)}
            placeholder={providerMeta.model}
            value={model}
          />
        </label>
      </div>
    </section>
  );
}
