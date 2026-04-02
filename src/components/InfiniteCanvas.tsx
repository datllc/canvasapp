"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";
import { v4 as uuid } from "uuid";
import {
  Tool,
  CanvasElement,
  PenElement,
  EraserElement,
  RectangleElement,
  CircleElement,
  LineElement,
  ArrowElement,
  TextElement,
  ImageElement,
  Point,
} from "@/types/canvas";
import { loadState, saveElements, saveViewport } from "@/store/canvasStore";
import Toolbar from "./Toolbar";
import CanvasElementRenderer from "./CanvasElements";

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

export default function InfiniteCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("pen");
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [fillColor, setFillColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(24);
  const [stagePos, setStagePos] = useState<Point>({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  const isDrawing = useRef(false);
  const currentElementId = useRef<string | null>(null);
  const drawStartPoint = useRef<Point>({ x: 0, y: 0 });

  // Load from localStorage on mount
  useEffect(() => {
    const state = loadState();
    setElements(state.elements);
    setStagePos(state.stagePosition);
    setStageScale(state.stageScale);
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setStageSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Save elements on change
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveElements(elements), 300);
  }, [elements]);

  // Get pointer position in canvas coordinates
  const getPointerPos = useCallback((): Point | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      x: (pointer.x - stagePos.x) / stageScale,
      y: (pointer.y - stagePos.y) / stageScale,
    };
  }, [stagePos, stageScale]);

  // Update element helper
  const updateElement = useCallback((id: string, attrs: Partial<CanvasElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...attrs } as CanvasElement) : el))
    );
  }, []);

  // Delete selected
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        // Don't delete if we're editing text in an input
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        )
          return;
        setElements((prev) => prev.filter((el) => el.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  // Zoom with mouse wheel
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stageScale;
      const pointer = stage.getPointerPosition()!;
      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 1.08;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, direction > 0 ? oldScale * factor : oldScale / factor)
      );

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setStageScale(newScale);
      setStagePos(newPos);
      saveViewport(newPos, newScale);
    },
    [stagePos, stageScale]
  );

  // ─── Mouse Handlers ───────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Middle mouse button → pan
      if (e.evt.button === 1) return;

      const pos = getPointerPos();
      if (!pos) return;

      // Right click does nothing special for drawing
      if (e.evt.button === 2) return;

      if (activeTool === "select") {
        // Clicking empty area deselects
        const clickedOnEmpty = e.target === stageRef.current;
        if (clickedOnEmpty) setSelectedId(null);
        return;
      }

      if (activeTool === "text") {
        // Place text on click
        const clickedOnEmpty = e.target === stageRef.current;
        if (!clickedOnEmpty) return;
        const id = uuid();
        const textEl: TextElement = {
          id,
          type: "text",
          x: pos.x,
          y: pos.y,
          text: "Type here",
          fontSize,
          fill: strokeColor,
          width: 200,
          rotation: 0,
          opacity: 1,
        };
        setElements((prev) => [...prev, textEl]);
        setSelectedId(id);
        // Trigger inline edit after render
        setTimeout(() => editTextNode(id), 50);
        return;
      }

      isDrawing.current = true;
      drawStartPoint.current = pos;
      const id = uuid();
      currentElementId.current = id;

      if (activeTool === "pen") {
        const el: PenElement = {
          id,
          type: "pen",
          x: 0,
          y: 0,
          points: [pos.x, pos.y],
          stroke: strokeColor,
          strokeWidth,
          rotation: 0,
          opacity: 1,
        };
        setElements((prev) => [...prev, el]);
      } else if (activeTool === "eraser") {
        const el: EraserElement = {
          id,
          type: "eraser",
          x: 0,
          y: 0,
          points: [pos.x, pos.y],
          strokeWidth: strokeWidth * 3,
          rotation: 0,
          opacity: 1,
        };
        setElements((prev) => [...prev, el]);
      } else if (activeTool === "rectangle") {
        const el: RectangleElement = {
          id,
          type: "rectangle",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          rotation: 0,
          opacity: 1,
        };
        setElements((prev) => [...prev, el]);
      } else if (activeTool === "circle") {
        const el: CircleElement = {
          id,
          type: "circle",
          x: pos.x,
          y: pos.y,
          radiusX: 0,
          radiusY: 0,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          rotation: 0,
          opacity: 1,
        };
        setElements((prev) => [...prev, el]);
      } else if (activeTool === "line") {
        const el: LineElement = {
          id,
          type: "line",
          x: 0,
          y: 0,
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: strokeColor,
          strokeWidth,
          rotation: 0,
          opacity: 1,
        };
        setElements((prev) => [...prev, el]);
      } else if (activeTool === "arrow") {
        const el: ArrowElement = {
          id,
          type: "arrow",
          x: 0,
          y: 0,
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: strokeColor,
          strokeWidth,
          rotation: 0,
          opacity: 1,
        };
        setElements((prev) => [...prev, el]);
      }
    },
    [activeTool, strokeColor, fillColor, strokeWidth, fontSize, getPointerPos]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Middle-button drag → pan
      if (e.evt.buttons === 4) {
        setStagePos((prev) => ({
          x: prev.x + e.evt.movementX,
          y: prev.y + e.evt.movementY,
        }));
        return;
      }

      if (!isDrawing.current || !currentElementId.current) return;
      const pos = getPointerPos();
      if (!pos) return;

      const id = currentElementId.current;

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== id) return el;

          if (el.type === "pen" || el.type === "eraser") {
            return { ...el, points: [...el.points, pos.x, pos.y] } as CanvasElement;
          }
          if (el.type === "rectangle") {
            return {
              ...el,
              width: pos.x - drawStartPoint.current.x,
              height: pos.y - drawStartPoint.current.y,
            } as CanvasElement;
          }
          if (el.type === "circle") {
            return {
              ...el,
              radiusX: Math.abs(pos.x - drawStartPoint.current.x),
              radiusY: Math.abs(pos.y - drawStartPoint.current.y),
            } as CanvasElement;
          }
          if (el.type === "line" || el.type === "arrow") {
            const pts = [...el.points];
            pts[2] = pos.x;
            pts[3] = pos.y;
            return { ...el, points: pts } as CanvasElement;
          }
          return el;
        })
      );
    },
    [getPointerPos]
  );

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false;
    currentElementId.current = null;
  }, []);

  // ─── Text editing ────────────────────────────────────────

  const editTextNode = useCallback(
    (id: string) => {
      const stage = stageRef.current;
      if (!stage) return;

      const textNode = stage.findOne(`#${id}`) as Konva.Text;
      if (!textNode) return;

      const textPosition = textNode.getAbsolutePosition();
      const stageBox = stage.container().getBoundingClientRect();

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      textarea.value = textNode.text();
      textarea.style.position = "absolute";
      textarea.style.top = `${stageBox.top + textPosition.y}px`;
      textarea.style.left = `${stageBox.left + textPosition.x}px`;
      textarea.style.width = `${textNode.width() * stageScale + 4}px`;
      textarea.style.fontSize = `${textNode.fontSize() * stageScale}px`;
      textarea.style.border = "2px solid #3b82f6";
      textarea.style.padding = "2px 4px";
      textarea.style.margin = "0";
      textarea.style.overflow = "hidden";
      textarea.style.background = "rgba(0,0,0,0.8)";
      textarea.style.color = textNode.fill() as string;
      textarea.style.outline = "none";
      textarea.style.resize = "none";
      textarea.style.lineHeight = String(textNode.lineHeight());
      textarea.style.fontFamily = textNode.fontFamily();
      textarea.style.zIndex = "1000";
      textarea.style.borderRadius = "4px";

      textNode.hide();
      textarea.focus();

      const finishEdit = () => {
        updateElement(id, { text: textarea.value } as Partial<CanvasElement>);
        textNode.show();
        textarea.remove();
      };

      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) {
          finishEdit();
        }
      });
      textarea.addEventListener("blur", finishEdit);
    },
    [stageScale, updateElement]
  );

  // Double click to edit text
  const handleDblClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const target = e.target;
      if (target instanceof Konva.Text) {
        editTextNode(target.id());
      }
    },
    [editTextNode]
  );

  // ─── Image upload ────────────────────────────────────────

  const handleImageUpload = useCallback(
    (dataUrl: string, width: number, height: number) => {
      const stage = stageRef.current;
      const center = stage
        ? {
            x: (stageSize.width / 2 - stagePos.x) / stageScale,
            y: (stageSize.height / 2 - stagePos.y) / stageScale,
          }
        : { x: 100, y: 100 };

      // Scale down large images
      const maxDim = 400;
      let w = width;
      let h = height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w *= ratio;
        h *= ratio;
      }

      const el: ImageElement = {
        id: uuid(),
        type: "image",
        x: center.x - w / 2,
        y: center.y - h / 2,
        src: dataUrl,
        width: w,
        height: h,
        rotation: 0,
        opacity: 1,
      };
      setElements((prev) => [...prev, el]);
    },
    [stagePos, stageScale, stageSize]
  );

  // ─── Clear & Reset ────────────────────────────────────────

  const handleClear = useCallback(() => {
    setElements([]);
    setSelectedId(null);
  }, []);

  const handleResetView = useCallback(() => {
    setStagePos({ x: 0, y: 0 });
    setStageScale(1);
    saveViewport({ x: 0, y: 0 }, 1);
  }, []);

  // Determine cursor style
  const getCursor = () => {
    switch (activeTool) {
      case "select":
        return "default";
      case "pen":
      case "eraser":
        return "crosshair";
      case "text":
        return "text";
      default:
        return "crosshair";
    }
  };

  // Drag-to-pan with middle mouse or space+drag
  const [spaceHeld, setSpaceHeld] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) setSpaceHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const stageDraggable = spaceHeld || activeTool === "select";

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-950" style={{ cursor: getCursor() }}>
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        fillColor={fillColor}
        setFillColor={setFillColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        fontSize={fontSize}
        setFontSize={setFontSize}
        onImageUpload={handleImageUpload}
        onClear={handleClear}
        onResetView={handleResetView}
      />

      {/* Zoom indicator */}
      <div className="fixed bottom-4 right-4 z-50 text-xs text-gray-400 bg-gray-900/80 px-2 py-1 rounded">
        {Math.round(stageScale * 100)}%
      </div>

      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={stageDraggable}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={handleDblClick}
        onDragEnd={() => {
          const stage = stageRef.current;
          if (stage && stageDraggable) {
            const pos = { x: stage.x(), y: stage.y() };
            setStagePos(pos);
            saveViewport(pos, stageScale);
          }
        }}
      >
        <Layer>
          {/* Grid dots (visual reference for infinite canvas) */}
          {/* Elements */}
          {elements.map((el) => (
            <CanvasElementRenderer
              key={el.id}
              element={el}
              isSelected={el.id === selectedId}
              onSelect={(id) => {
                if (activeTool === "select") setSelectedId(id);
              }}
              onChange={updateElement}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
