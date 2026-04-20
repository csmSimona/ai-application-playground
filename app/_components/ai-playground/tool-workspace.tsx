import type { FormEvent } from "react";
import ChatApp from "./apps/chat-app";
import ColorPaletteApp from "./apps/color-palette-app";
import CsvApp from "./apps/csv-app";
import DrawGuessApp from "./apps/draw-guess-app";
import PdfApp from "./apps/pdf-app";
import VideoApp from "./apps/video-app";
import XiaohongshuApp from "./apps/xiaohongshu-app";
import type { Message, ToolId } from "./types";

type ToolWorkspaceProps = {
  activeTool: ToolId;
  chatMessages: Message[];
  error: string;
  isAccessReady: boolean;
  loading: boolean;
  onClearChat: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  result: string;
};

export default function ToolWorkspace({
  activeTool,
  chatMessages,
  error,
  isAccessReady,
  loading,
  onClearChat,
  onSubmit,
  result,
}: ToolWorkspaceProps) {
  const appProps = {
    error,
    isAccessReady,
    loading,
    onSubmit,
    result,
  };

  if (activeTool === "video") {
    return <VideoApp {...appProps} />;
  }

  if (activeTool === "xiaohongshu") {
    return <XiaohongshuApp {...appProps} />;
  }

  if (activeTool === "chat") {
    return (
      <ChatApp
        {...appProps}
        chatMessages={chatMessages}
        onClearChat={onClearChat}
      />
    );
  }

  if (activeTool === "pdf") {
    return <PdfApp {...appProps} />;
  }

  if (activeTool === "drawGuess") {
    return <DrawGuessApp {...appProps} />;
  }

  if (activeTool === "colorPalette") {
    return <ColorPaletteApp {...appProps} />;
  }

  return <CsvApp {...appProps} />;
}
