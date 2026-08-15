import { Service } from '@angular/core';

interface Point {
  x: number;
  y: number;
}

@Service()
export class SignaturePadService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private drawing = false;
  private strokes: Point[][] = [];
  private currentStroke: Point[] = [];
  private width = 0;
  private height = 0;
  private readonly strokeWidth = 2.5;
  private resizeObserver: ResizeObserver | null = null;

  private readonly onPointerDown = (event: PointerEvent): void => {
    event.preventDefault();
    const point = this.toLocalPoint(event);
    if (!point || !this.ctx || !this.canvas) {
      return;
    }
    this.canvas.setPointerCapture(event.pointerId);
    this.drawing = true;
    this.currentStroke = [point];
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.drawing || !this.ctx) {
      return;
    }
    event.preventDefault();
    const point = this.toLocalPoint(event);
    if (!point) {
      return;
    }
    this.currentStroke.push(point);
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.drawing) {
      return;
    }
    event.preventDefault();
    this.drawing = false;
    if (this.currentStroke.length > 0) {
      this.strokes.push(this.currentStroke);
    }
    this.currentStroke = [];
  };

  attach(canvas: HTMLCanvasElement): void {
    this.detach();
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      return;
    }

    this.resizeToDisplaySize();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#0b0d10';
    this.ctx.lineWidth = this.strokeWidth;

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.drawing) {
          return;
        }
        const previous = this.strokes;
        this.resizeToDisplaySize();
        this.redrawStrokes(previous);
      });
      this.resizeObserver.observe(canvas);
    }
  }

  detach(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.onPointerDown);
      this.canvas.removeEventListener('pointermove', this.onPointerMove);
      this.canvas.removeEventListener('pointerup', this.onPointerUp);
      this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    }
    this.canvas = null;
    this.ctx = null;
    this.drawing = false;
    this.currentStroke = [];
  }

  clear(): void {
    this.strokes = [];
    this.currentStroke = [];
    if (!this.ctx || !this.canvas) {
      return;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  isEmpty(): boolean {
    return this.strokes.length === 0 && this.currentStroke.length === 0;
  }

  /** Compact SVG data URL suitable for redirect query params. */
  toSvgDataUrl(): string {
    const width = this.width || 600;
    const height = this.height || 240;
    const paths = this.strokes
      .filter((stroke) => stroke.length > 0)
      .map((stroke) => {
        const [first, ...rest] = stroke;
        const d = [
          `M${round(first.x)} ${round(first.y)}`,
          ...rest.map((p) => `L${round(p.x)} ${round(p.y)}`),
        ].join(' ');
        return `<path d="${d}" fill="none" stroke="#0b0d10" stroke-width="${this.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
      })
      .join('');

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<rect width="100%" height="100%" fill="#fff"/>${paths}</svg>`;

    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  toPngDataUrl(): string {
    if (!this.canvas) {
      return '';
    }
    // White background for PNG consumers that don't handle transparency well.
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.canvas.width;
    exportCanvas.height = this.canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) {
      return this.canvas.toDataURL('image/png');
    }
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(this.canvas, 0, 0);
    return exportCanvas.toDataURL('image/png');
  }

  private resizeToDisplaySize(): void {
    if (!this.canvas || !this.ctx) {
      return;
    }
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#0b0d10';
    this.ctx.lineWidth = this.strokeWidth;
  }

  private redrawStrokes(strokes: Point[][]): void {
    if (!this.ctx) {
      return;
    }
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.strokes = strokes;
    for (const stroke of strokes) {
      if (stroke.length === 0) {
        continue;
      }
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        this.ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      this.ctx.stroke();
    }
  }

  private toLocalPoint(event: PointerEvent): Point | null {
    if (!this.canvas) {
      return null;
    }
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
