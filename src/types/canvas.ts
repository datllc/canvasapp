export type Tool =
  | "select"
  | "pen"
  | "eraser"
  | "text"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "image";

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
}

export interface PenElement extends BaseElement {
  type: "pen";
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export interface EraserElement extends BaseElement {
  type: "eraser";
  points: number[];
  strokeWidth: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fill: string;
  width: number;
}

export interface RectangleElement extends BaseElement {
  type: "rectangle";
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface CircleElement extends BaseElement {
  type: "circle";
  radiusX: number;
  radiusY: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface LineElement extends BaseElement {
  type: "line";
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export interface ArrowElement extends BaseElement {
  type: "arrow";
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  width: number;
  height: number;
}

export type CanvasElement =
  | PenElement
  | EraserElement
  | TextElement
  | RectangleElement
  | CircleElement
  | LineElement
  | ArrowElement
  | ImageElement;

export interface CanvasState {
  elements: CanvasElement[];
  stagePosition: Point;
  stageScale: number;
}
