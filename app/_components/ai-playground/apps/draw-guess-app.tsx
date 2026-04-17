"use client";

import type { FormEvent, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { AppInputCard, AppLayout, TextOutputCard } from "../app-shell";
import type { AppViewProps } from "../types";

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 480;

export default function DrawGuessApp({
  error,
  isAccessReady,
  loading,
  onSubmit,
  result,
}: AppViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [brushColor, setBrushColor] = useState("#1b1a17");
  const [brushSize, setBrushSize] = useState(8);
  const [status, setStatus] = useState("先画点东西，再交给 AI 猜。");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) {
      return;
    }

    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getCanvasContext() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) {
      return null;
    }

    return { canvas, ctx };
  }

  function getPoint(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const result = getCanvasContext();
    if (!result || !isAccessReady || loading) {
      return;
    }

    const { ctx } = result;
    const { x, y } = getPoint(event);
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    event.currentTarget.setPointerCapture(event.pointerId);
    setStatus("线条收到。");
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) {
      return;
    }

    const result = getCanvasContext();
    if (!result) {
      return;
    }

    const { ctx } = result;
    const { x, y } = getPoint(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handlePointerUp(event: PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function resetCanvas(nextStatus = "画板已清空。换个脑洞继续。") {
    const result = getCanvasContext();
    if (!result) {
      return;
    }

    const { canvas, ctx } = result;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setStatus(nextStatus);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const canvas = canvasRef.current;
    const imageInput = event.currentTarget.elements.namedItem("imageDataUrl");

    if (canvas && imageInput instanceof HTMLInputElement) {
      imageInput.value = canvas.toDataURL("image/png");
      setStatus("AI 正在观察你的画。");
    }

    onSubmit(event);
  }

  return (
    <AppLayout>
      <AppInputCard
        actions={
          <button
            className="secondary-button"
            disabled={loading || !isAccessReady}
            onClick={() => resetCanvas()}
            type="button"
          >
            清空画板
          </button>
        }
        error={error}
        isAccessReady={isAccessReady}
        loading={loading}
        onSubmit={handleSubmit}
        title="你画我猜"
      >
        <p className="mini-label">
          请使用支持图片输入的视觉模型。
        </p>
        <input name="imageDataUrl" type="hidden" />
          <canvas
            aria-label="你画我猜画板"
            className="draw-canvas"
            height={CANVAS_HEIGHT}
            onPointerCancel={handlePointerUp}
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerUp}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            ref={canvasRef}
            width={CANVAS_WIDTH}
          />
        <div className="draw-toolbar">
          <label className="grid gap-1">
            <span className="mini-label">颜色</span>
            <input
              aria-label="画笔颜色"
              className="draw-color"
              onChange={(event) => setBrushColor(event.target.value)}
              type="color"
              value={brushColor}
            />
          </label>
          <label className="grid min-w-48 flex-1 gap-1">
            <span className="mini-label">粗细：{brushSize}px</span>
            <input
              max={30}
              min={2}
              onChange={(event) => setBrushSize(Number(event.target.value))}
              type="range"
              value={brushSize}
            />
          </label>
          <p className="draw-status">{status}</p>
        </div>
      </AppInputCard>

      <TextOutputCard result={result} />
    </AppLayout>
  );
}
