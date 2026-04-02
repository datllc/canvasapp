"use client";

import React, { useRef } from "react";
import { Tool } from "@/types/canvas";

interface ToolbarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  onImageUpload: (dataUrl: string, width: number, height: number) => void;
  onClear: () => void;
  onResetView: () => void;
}

const TOOLS: { tool: Tool; label: string; icon: string }[] = [
  { tool: "select", label: "Select", icon: "↖" },
  { tool: "pen", label: "Pen", icon: "✏" },
  { tool: "eraser", label: "Eraser", icon: "⌫" },
  { tool: "line", label: "Line", icon: "╱" },
  { tool: "arrow", label: "Arrow", icon: "→" },
  { tool: "rectangle", label: "Rectangle", icon: "▭" },
  { tool: "circle", label: "Ellipse", icon: "◯" },
  { tool: "text", label: "Text", icon: "T" },
  { tool: "image", label: "Image", icon: "🖼" },
];

const PRESET_COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

export default function Toolbar({
  activeTool,
  setActiveTool,
  strokeColor,
  setStrokeColor,
  fillColor,
  setFillColor,
  strokeWidth,
  setStrokeWidth,
  fontSize,
  setFontSize,
  onImageUpload,
  onClear,
  onResetView,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (tool: Tool) => {
    if (tool === "image") {
      fileInputRef.current?.click();
    } else {
      setActiveTool(tool);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        onImageUpload(reader.result as string, img.width, img.height);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-2 px-3 py-2 bg-gray-900/95 backdrop-blur border-b border-gray-700 text-white select-none">
      {/* Tools */}
      <div className="flex gap-1">
        {TOOLS.map(({ tool, label, icon }) => (
          <button
            key={tool}
            title={label}
            onClick={() => handleToolClick(tool)}
            className={`w-9 h-9 flex items-center justify-center rounded text-sm transition-colors
              ${activeTool === tool ? "bg-blue-600" : "hover:bg-gray-700"}`}
          >
            {icon}
          </button>
        ))}
      </div>

      <div className="w-px h-7 bg-gray-600 mx-1" />

      {/* Stroke Color */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400">Stroke</span>
        <div className="flex gap-0.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={`s-${c}`}
              title={c}
              onClick={() => setStrokeColor(c)}
              className={`w-5 h-5 rounded-sm border transition-transform
                ${strokeColor === c ? "border-white scale-125" : "border-gray-600"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => setStrokeColor(e.target.value)}
          className="w-6 h-6 cursor-pointer bg-transparent border-0"
        />
      </div>

      <div className="w-px h-7 bg-gray-600 mx-1" />

      {/* Fill Color */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400">Fill</span>
        <button
          title="No fill"
          onClick={() => setFillColor("transparent")}
          className={`w-5 h-5 rounded-sm border text-[10px] leading-none flex items-center justify-center
            ${fillColor === "transparent" ? "border-white" : "border-gray-600"}`}
        >
          ∅
        </button>
        <div className="flex gap-0.5">
          {PRESET_COLORS.slice(0, 6).map((c) => (
            <button
              key={`f-${c}`}
              title={c}
              onClick={() => setFillColor(c)}
              className={`w-5 h-5 rounded-sm border transition-transform
                ${fillColor === c ? "border-white scale-125" : "border-gray-600"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <input
          type="color"
          value={fillColor === "transparent" ? "#000000" : fillColor}
          onChange={(e) => setFillColor(e.target.value)}
          className="w-6 h-6 cursor-pointer bg-transparent border-0"
        />
      </div>

      <div className="w-px h-7 bg-gray-600 mx-1" />

      {/* Stroke Width */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400">Size</span>
        <input
          type="range"
          min={1}
          max={20}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-16 accent-blue-500"
        />
        <span className="text-xs w-5 text-center">{strokeWidth}</span>
      </div>

      {/* Font Size (show when text tool active) */}
      {activeTool === "text" && (
        <>
          <div className="w-px h-7 bg-gray-600 mx-1" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Font</span>
            <input
              type="range"
              min={12}
              max={72}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-16 accent-blue-500"
            />
            <span className="text-xs w-6 text-center">{fontSize}</span>
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <button
        onClick={onResetView}
        title="Reset view"
        className="px-2 py-1 text-xs rounded hover:bg-gray-700 transition-colors"
      >
        Reset View
      </button>
      <button
        onClick={onClear}
        title="Clear canvas"
        className="px-2 py-1 text-xs rounded hover:bg-red-700 text-red-400 transition-colors"
      >
        Clear All
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
