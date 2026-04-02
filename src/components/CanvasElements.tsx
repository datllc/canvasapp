"use client";

import React, { useEffect, useRef, useState } from "react";
import { Line, Rect, Ellipse, Arrow, Text, Image as KImage, Transformer } from "react-konva";
import { CanvasElement } from "@/types/canvas";
import Konva from "konva";

interface ElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, attrs: Partial<CanvasElement>) => void;
}

function useKonvaImage(src: string): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = src;
  }, [src]);
  return image;
}

function ImageRenderer({
  element,
  isSelected,
  onSelect,
  onChange,
}: ElementRendererProps & { element: { type: "image"; src: string; width: number; height: number } }) {
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const image = useKonvaImage(element.src);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KImage
        ref={shapeRef}
        id={element.id}
        image={image}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        opacity={element.opacity}
        draggable={true}
        onClick={() => onSelect(element.id)}
        onTap={() => onSelect(element.id)}
        onDragEnd={(e) => {
          onChange(element.id, { x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current!;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange(element.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          } as Partial<CanvasElement>);
        }}
      />
      {isSelected && <Transformer ref={trRef} />}
    </>
  );
}

export default function CanvasElementRenderer({
  element,
  isSelected,
  onSelect,
  onChange,
}: ElementRendererProps) {
  const shapeRef = useRef<Konva.Shape>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const commonDragProps = {
    draggable: true,
    onClick: () => onSelect(element.id),
    onTap: () => onSelect(element.id),
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      onChange(element.id, { x: e.target.x(), y: e.target.y() });
    },
  };

  const transformEnd = () => {
    const node = shapeRef.current!;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onChange(element.id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      ...(element.type === "rectangle"
        ? { width: node.width() * scaleX, height: node.height() * scaleY }
        : element.type === "circle"
        ? { radiusX: (node as unknown as Konva.Ellipse).radiusX() * scaleX, radiusY: (node as unknown as Konva.Ellipse).radiusY() * scaleY }
        : {}),
    } as Partial<CanvasElement>);
  };

  switch (element.type) {
    case "pen":
      return (
        <>
          <Line
            ref={shapeRef as React.RefObject<Konva.Line>}
            id={element.id}
            x={element.x}
            y={element.y}
            points={element.points}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation="source-over"
            {...commonDragProps}
          />
          {isSelected && <Transformer ref={trRef} />}
        </>
      );

    case "eraser":
      return (
        <Line
          id={element.id}
          x={element.x}
          y={element.y}
          points={element.points}
          stroke="#c0c0c0"
          strokeWidth={element.strokeWidth}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation="destination-out"
        />
      );

    case "line":
      return (
        <>
          <Line
            ref={shapeRef as React.RefObject<Konva.Line>}
            id={element.id}
            x={element.x}
            y={element.y}
            points={element.points}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            lineCap="round"
            {...commonDragProps}
          />
          {isSelected && <Transformer ref={trRef} />}
        </>
      );

    case "arrow":
      return (
        <>
          <Arrow
            ref={shapeRef as React.RefObject<Konva.Arrow>}
            id={element.id}
            x={element.x}
            y={element.y}
            points={element.points}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            fill={element.stroke}
            lineCap="round"
            {...commonDragProps}
          />
          {isSelected && <Transformer ref={trRef} />}
        </>
      );

    case "rectangle":
      return (
        <>
          <Rect
            ref={shapeRef as React.RefObject<Konva.Rect>}
            id={element.id}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            rotation={element.rotation}
            {...commonDragProps}
            onTransformEnd={transformEnd}
          />
          {isSelected && <Transformer ref={trRef} />}
        </>
      );

    case "circle":
      return (
        <>
          <Ellipse
            ref={shapeRef as React.RefObject<Konva.Ellipse>}
            id={element.id}
            x={element.x}
            y={element.y}
            radiusX={element.radiusX}
            radiusY={element.radiusY}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            rotation={element.rotation}
            {...commonDragProps}
            onTransformEnd={transformEnd}
          />
          {isSelected && <Transformer ref={trRef} />}
        </>
      );

    case "text":
      return (
        <>
          <Text
            ref={shapeRef as React.RefObject<Konva.Text>}
            id={element.id}
            x={element.x}
            y={element.y}
            text={element.text}
            fontSize={element.fontSize}
            fill={element.fill}
            width={element.width || undefined}
            rotation={element.rotation}
            {...commonDragProps}
            onTransformEnd={transformEnd}
            onDblClick={() => {
              // handled by parent
            }}
          />
          {isSelected && (
            <Transformer
              ref={trRef}
              enabledAnchors={["middle-left", "middle-right"]}
              boundBoxFunc={(oldBox, newBox) => {
                const box = { ...newBox };
                box.width = Math.max(30, newBox.width);
                return box;
              }}
            />
          )}
        </>
      );

    case "image":
      return (
        <ImageRenderer
          element={element}
          isSelected={isSelected}
          onSelect={onSelect}
          onChange={onChange}
        />
      );

    default:
      return null;
  }
}
