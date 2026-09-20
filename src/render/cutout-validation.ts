export type NumericPoint = [number, number];
export type CropRect = [number, number, number, number];

export interface CutoutPartDefinition {
  id: string;
  texture: string;
  rect: CropRect;
  pivot: NumericPoint;
  scale: number;
  z: number;
  attachTo?: string;
  attachments?: Record<string, NumericPoint>;
  joints?: Record<string, NumericPoint>;
  string?: Record<string, NumericPoint>;
  rail?: Record<string, NumericPoint>;
  recoilAxis?: NumericPoint;
}

export interface CutoutDefinition {
  id: string;
  kind: "cutout-character" | "cutout-tower";
  parts: CutoutPartDefinition[];
  [key: string]: unknown;
}

export interface CutoutValidationOptions {
  /** Optional source sheet dimensions used to bound every crop rectangle. */
  sourceWidth?: number;
  sourceHeight?: number;
  /** Optional asset namespace, for example `v2` or `v3`. */
  namespace?: string;
}

const ID = /^[A-Za-z][A-Za-z0-9]*$/;
const POINT_NAME = /^[A-Za-z][A-Za-z0-9_-]*$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REQUIRED_STRING_POINTS = [
  "tipNear",
  "tipFar",
  "braceCenter",
  "drawCenter",
] as const;
const REQUIRED_RAIL_POINTS = ["rear", "release"] as const;

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(path, "object required");
  return value as Record<string, unknown>;
}

function finite(value: unknown, path: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value))
    fail(path, "finite number required");
}

function pair(value: unknown, path: string): value is NumericPoint {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    value.some((item) => typeof item !== "number" || !Number.isFinite(item))
  )
    fail(path, "finite [x, y] point required");
  return true;
}

function pointMap(
  value: unknown,
  path: string,
  required: readonly string[] = [],
): Record<string, NumericPoint> | undefined {
  if (value === undefined) return undefined;
  const input = record(value, path);
  for (const name of required)
    if (!Object.prototype.hasOwnProperty.call(input, name))
      fail(`${path}.${name}`, "required point missing");
  const output: Record<string, NumericPoint> = {};
  for (const [name, point] of Object.entries(input)) {
    if (
      !POINT_NAME.test(name) ||
      ["__proto__", "constructor", "prototype"].includes(name)
    )
      fail(`${path}.${name}`, "safe point name required");
    pair(point, `${path}.${name}`);
    output[name] = point as NumericPoint;
  }
  return output;
}

function safeTexturePath(
  value: unknown,
  path: string,
  namespace?: string,
): string {
  if (typeof value !== "string" || !value || value.trim() !== value)
    fail(path, "relative texture path required");
  if (
    value.startsWith("/") ||
    value.startsWith("\\") ||
    value.includes("\\") ||
    value.includes("%") ||
    value.includes("?") ||
    value.includes("#") ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)
  )
    fail(path, "unsafe texture path");
  const segments = value.split("/");
  if (
    segments.some((segment) => !segment || segment === "." || segment === "..")
  )
    fail(path, "normalized relative texture path required");
  if (namespace && (segments[0] !== "art" || segments[1] !== namespace))
    fail(path, `texture must be inside art/${namespace}`);
  return value;
}

function validateSourceDimension(value: unknown, path: string): number {
  finite(value, path);
  if (!Number.isInteger(value) || value <= 0)
    fail(path, "positive integer required");
  return value;
}

function validateOptions(
  options: CutoutValidationOptions,
): CutoutValidationOptions {
  if (options.sourceWidth !== undefined)
    validateSourceDimension(options.sourceWidth, "sourceWidth");
  if (options.sourceHeight !== undefined)
    validateSourceDimension(options.sourceHeight, "sourceHeight");
  if (options.namespace !== undefined && !SLUG.test(options.namespace))
    fail("namespace", "lowercase slug required");
  return options;
}

/**
 * Validate a cutout descriptor before any image request or Three.js object is
 * created. The returned value keeps the original descriptor shape; validation
 * is deliberately pure and does not normalize or mutate it.
 */
export function validateCutoutDefinition(
  value: unknown,
  options?: CutoutValidationOptions,
): CutoutDefinition;
export function validateCutoutDefinition(
  value: unknown,
  sourceWidth?: number,
  sourceHeight?: number,
  namespace?: string,
): CutoutDefinition;
export function validateCutoutDefinition(
  value: unknown,
  optionsOrWidth: CutoutValidationOptions | number = {},
  sourceHeight?: number,
  namespace?: string,
): CutoutDefinition {
  const options: CutoutValidationOptions =
    typeof optionsOrWidth === "number"
      ? { sourceWidth: optionsOrWidth, sourceHeight, namespace }
      : optionsOrWidth;
  validateOptions(options);
  const input = record(value, "definition");
  const descriptorWidth =
    input.width === undefined
      ? undefined
      : validateSourceDimension(input.width, "definition.width");
  const descriptorHeight =
    input.height === undefined
      ? undefined
      : validateSourceDimension(input.height, "definition.height");
  const sourceWidth = options.sourceWidth ?? descriptorWidth;
  const sourceHeightValue = options.sourceHeight ?? descriptorHeight;
  if (typeof input.id !== "string" || !SLUG.test(input.id))
    fail("definition.id", "lowercase slug required");
  if (input.kind !== "cutout-character" && input.kind !== "cutout-tower")
    fail("definition.kind", "unsupported cutout kind");
  if (!Array.isArray(input.parts) || input.parts.length === 0)
    fail("definition.parts", "at least one part required");

  const parts: CutoutPartDefinition[] = [];
  const byId = new Map<string, CutoutPartDefinition>();
  for (const [index, raw] of input.parts.entries()) {
    const path = `definition.parts[${index}]`;
    const part = record(raw, path);
    if (typeof part.id !== "string" || !ID.test(part.id))
      fail(`${path}.id`, "simple unique id required");
    if (byId.has(part.id)) fail(`${path}.id`, "part ids must be unique");
    if (typeof part.texture !== "string")
      fail(`${path}.texture`, "relative texture path required");
    safeTexturePath(part.texture, `${path}.texture`, options.namespace);
    if (!Array.isArray(part.rect) || part.rect.length !== 4)
      fail(`${path}.rect`, "integer crop rectangle required");
    const rect = part.rect as unknown[];
    if (
      rect.some((item) => typeof item !== "number" || !Number.isInteger(item))
    )
      fail(`${path}.rect`, "integer crop rectangle required");
    const [x, y, width, height] = rect as CropRect;
    if (x < 0 || y < 0 || width <= 0 || height <= 0)
      fail(
        `${path}.rect`,
        "positive crop dimensions and non-negative origin required",
      );
    if (sourceWidth !== undefined && x + width > sourceWidth)
      fail(`${path}.rect`, "crop exceeds source width");
    if (sourceHeightValue !== undefined && y + height > sourceHeightValue)
      fail(`${path}.rect`, "crop exceeds source height");
    pair(part.pivot, `${path}.pivot`);
    const pivot = part.pivot as NumericPoint;
    if (pivot[0] < 0 || pivot[0] > width)
      fail(`${path}.pivot`, "x must lie inside crop");
    if (pivot[1] < 0 || pivot[1] > height)
      fail(`${path}.pivot`, "y must lie inside crop");
    finite(part.scale, `${path}.scale`);
    if (part.scale <= 0) fail(`${path}.scale`, "positive scale required");
    finite(part.z, `${path}.z`);
    if (
      part.attachTo !== undefined &&
      (typeof part.attachTo !== "string" || part.attachTo.trim() === "")
    )
      fail(`${path}.attachTo`, "non-empty attachment reference required");

    const attachments = pointMap(part.attachments, `${path}.attachments`);
    if (attachments)
      for (const [name, point] of Object.entries(attachments)) {
        if (
          point[0] < 0 ||
          point[0] > width ||
          point[1] < 0 ||
          point[1] > height
        )
          fail(`${path}.attachments.${name}`, "point must lie inside crop");
      }
    const joints = pointMap(part.joints, `${path}.joints`);
    const string = pointMap(
      part.string,
      `${path}.string`,
      REQUIRED_STRING_POINTS,
    );
    const rail = pointMap(part.rail, `${path}.rail`, REQUIRED_RAIL_POINTS);
    if (string && !rail)
      fail(`${path}.rail`, "required when string points are present");
    if (part.recoilAxis !== undefined)
      pair(part.recoilAxis, `${path}.recoilAxis`);

    const normalized = {
      ...part,
      rect: [x, y, width, height] as CropRect,
      pivot: [pivot[0], pivot[1]] as NumericPoint,
      attachments,
      joints,
      string,
      rail,
    } as CutoutPartDefinition;
    parts.push(normalized);
    byId.set(normalized.id, normalized);
  }

  const roots = parts.filter((part) => !part.attachTo);
  // Resolve every parent chain before checking the direct-child restriction so
  // a real cycle is reported as a cycle rather than as a missing root.
  for (const part of parts) {
    const visited = new Set<string>();
    let current: CutoutPartDefinition | undefined = part;
    while (current?.attachTo) {
      if (visited.has(current.id))
        fail(`${part.id}.attachTo`, "attachment cycle detected");
      visited.add(current.id);
      const [parentId, anchor, ...extra] = current.attachTo.split(".");
      if (extra.length || !parentId || !anchor)
        fail(`${current.id}.attachTo`, "expected parent.anchor reference");
      const parent = byId.get(parentId);
      if (!parent) fail(`${current.id}.attachTo`, `unknown parent ${parentId}`);
      if (
        !parent.attachments ||
        !Object.prototype.hasOwnProperty.call(parent.attachments, anchor)
      )
        fail(
          `${current.id}.attachTo`,
          `missing attachment ${parentId}.${anchor}`,
        );
      current = parent;
    }
  }
  for (const part of parts)
    if (part.attachTo) {
      const [parentId] = part.attachTo.split(".");
      if (byId.get(parentId)?.attachTo)
        fail(`${part.id}.attachTo`, "nested attachments unsupported");
    }
  if (roots.length !== 1)
    fail("definition.parts", "exactly one root part required");

  return { ...input, parts } as CutoutDefinition;
}
