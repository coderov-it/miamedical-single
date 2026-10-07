/**
 * A drawn signature on a `<canvas>`, shared by the checkout's contract step (and
 * its enlarged popup) and `/firma-contratto/`. Pointer events cover mouse, pen
 * and touch in one path; the canvas carries `touch-none` so a stroke never
 * scrolls the page.
 *
 * WHY IT LOOKS LIKE INK. Straight `lineTo` between pointer samples draws a
 * polygon — visible corners wherever the hand moved fast. Instead:
 *
 *   1. every sample counts     `getCoalescedEvents()` — the browser batches
 *                               several per frame; drawing only the last loses them
 *   2. curves, not segments     each stroke runs through the MIDPOINTS of its
 *                               samples, with the sample itself as the control point
 *   3. width follows speed      slow → up to MAX_WIDTH, fast → down to MIN_WIDTH,
 *                               low-pass filtered so the line never jumps in weight
 *
 * The curve is laid down as overlapping dots, so its width can change smoothly
 * along it — a canvas stroke has one `lineWidth` for its whole path.
 *
 * The backing store follows the box's CSS size × devicePixelRatio, so the line
 * stays sharp on a phone. A width change clears it — the browser drops the
 * bitmap anyway — and `onChange` reports the pad empty again.
 */
export interface SignaturePad {
  isEmpty: () => boolean;
  clear: () => void;
  toDataUrl: () => string;
  /** Re-fits the backing store to the box. Call once the canvas is visible. */
  fit: () => void;
  /** Replaces this pad's drawing with another pad's signature, cropped and fitted. */
  drawFrom: (source: SignaturePad) => void;
  /** The drawn area in backing-store pixels, or null when empty. */
  crop: () => {
    canvas: HTMLCanvasElement;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

const MIN_WIDTH = 1.1;
const MAX_WIDTH = 3.4;
/** Weight of the newest velocity sample; the rest is the previous estimate. */
const VELOCITY_FILTER = 0.7;
/** Samples closer than this add nothing but noise. */
const MIN_DISTANCE = 0.8;
const INK = '#14171f';

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  time: (a.time + b.time) / 2,
});

export function createSignaturePad(
  canvas: HTMLCanvasElement,
  onChange: (empty: boolean) => void = () => {},
): SignaturePad {
  const ctx = canvas.getContext('2d');
  let empty = true;
  let fittedWidth = 0;
  let dpr = 1;

  /* The stroke in progress. */
  let points: Point[] = [];
  let velocity = 0;
  let width = (MIN_WIDTH + MAX_WIDTH) / 2;
  /* Where ink has landed, in CSS pixels — what `crop` cuts to. */
  let bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };

  function setEmpty(value: boolean): void {
    if (empty === value) return;
    empty = value;
    onChange(value);
  }

  function reset(): void {
    bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    setEmpty(true);
  }

  function fit(): void {
    const rect = canvas.getBoundingClientRect();
    /* A hidden canvas measures 0 — fitting it then would leave a 0×0 store. */
    if (!ctx || rect.width === 0 || rect.width === fittedWidth) return;
    fittedWidth = rect.width;
    dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = INK;
    reset();
  }

  function dot(x: number, y: number, size: number): void {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    bounds.left = Math.min(bounds.left, x - size);
    bounds.top = Math.min(bounds.top, y - size);
    bounds.right = Math.max(bounds.right, x + size);
    bounds.bottom = Math.max(bounds.bottom, y + size);
  }

  /** A quadratic curve from `start` to `end` bent by `control`, its width easing from→to. */
  function curve(start: Point, control: Point, end: Point, from: number, to: number): void {
    const length = distance(start, control) + distance(control, end);
    const steps = Math.max(1, Math.ceil(length / 0.6));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      const x = u * u * start.x + 2 * u * t * control.x + t * t * end.x;
      const y = u * u * start.y + 2 * u * t * control.y + t * t * end.y;
      dot(x, y, from + (to - from) * t);
    }
  }

  function addPoint(point: Point): void {
    const previous = points[points.length - 1];
    if (!previous || distance(previous, point) < MIN_DISTANCE) return;
    points.push(point);

    const elapsed = Math.max(point.time - previous.time, 1);
    velocity =
      VELOCITY_FILTER * (distance(previous, point) / elapsed) + (1 - VELOCITY_FILTER) * velocity;
    const next = Math.max(MAX_WIDTH / (velocity + 1), MIN_WIDTH);

    if (points.length >= 3) {
      const [a, b, c] = points.slice(-3) as [Point, Point, Point];
      /* The first curve starts at the pen-down point itself, so no ink is lost. */
      const start = points.length === 3 ? a : midpoint(a, b);
      curve(start, b, midpoint(b, c), width, next);
      setEmpty(false);
    }
    width = next;
  }

  function finishStroke(): void {
    const [b, c] = points.slice(-2);
    /* The tail from the last midpoint to where the pen lifted. */
    if (b && c) curve(midpoint(b, c), c, c, width, width);
    if (points.length >= 2) setEmpty(false);
    points = [];
  }

  function pointOf(event: PointerEvent): Point {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, time: event.timeStamp };
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (!ctx) return;
    fit();
    canvas.setPointerCapture(event.pointerId);
    points = [pointOf(event)];
    velocity = 0;
    width = (MIN_WIDTH + MAX_WIDTH) / 2;
  });

  canvas.addEventListener('pointermove', (event) => {
    if (points.length === 0) return;
    event.preventDefault();
    const samples = event.getCoalescedEvents?.() ?? [];
    for (const sample of samples.length > 0 ? samples : [event]) addPoint(pointOf(sample));
  });

  canvas.addEventListener('pointerup', finishStroke);
  canvas.addEventListener('pointercancel', finishStroke);

  window.addEventListener('resize', fit);

  function clear(): void {
    ctx?.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    points = [];
    reset();
  }

  return {
    isEmpty: () => empty,
    clear,
    toDataUrl: () => canvas.toDataURL('image/png'),
    fit,
    crop: () => {
      if (empty) return null;
      const x = Math.max(0, bounds.left * dpr);
      const y = Math.max(0, bounds.top * dpr);
      return {
        canvas,
        x,
        y,
        width: Math.min(canvas.width, bounds.right * dpr) - x,
        height: Math.min(canvas.height, bounds.bottom * dpr) - y,
      };
    },
    drawFrom: (source) => {
      const area = source.crop();
      fit();
      clear();
      if (!ctx || !area) return;
      const box = canvas.getBoundingClientRect();
      /* Fitted inside a margin and centred, never enlarged past its own size. */
      const margin = 14;
      const scale = Math.min(
        (box.width - margin * 2) / area.width,
        (box.height - margin * 2) / area.height,
        1 / (window.devicePixelRatio || 1),
      );
      const drawWidth = area.width * scale;
      const drawHeight = area.height * scale;
      const left = (box.width - drawWidth) / 2;
      const top = (box.height - drawHeight) / 2;
      ctx.drawImage(
        area.canvas,
        area.x,
        area.y,
        area.width,
        area.height,
        left,
        top,
        drawWidth,
        drawHeight,
      );
      bounds = { left, top, right: left + drawWidth, bottom: top + drawHeight };
      setEmpty(false);
    },
  };
}
