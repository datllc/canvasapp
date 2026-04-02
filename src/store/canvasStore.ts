import { CanvasElement, CanvasState, Point } from "@/types/canvas";

const STORAGE_KEY = "infinite-canvas-state";

const DEFAULT_STATE: CanvasState = {
  elements: [],
  stagePosition: { x: 0, y: 0 },
  stageScale: 1,
};

export function loadState(): CanvasState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return JSON.parse(raw) as CanvasState;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: CanvasState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full — silently fail
  }
}

export function saveElements(elements: CanvasElement[]): void {
  const state = loadState();
  state.elements = elements;
  saveState(state);
}

export function saveViewport(position: Point, scale: number): void {
  const state = loadState();
  state.stagePosition = position;
  state.stageScale = scale;
  saveState(state);
}
