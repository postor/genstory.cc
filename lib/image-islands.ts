export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ImageIsland {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  data: Uint8ClampedArray;
  landPixelCount: number;
}

export interface TrimmedImage {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  data: Uint8ClampedArray;
  visiblePixelCount: number;
}

export interface TrimImageBackgroundInput {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
  backgroundColor?: RgbaColor | readonly [number, number, number, number?];
  tolerance?: number;
}

export interface TrimImageBackgroundResult {
  width: number;
  height: number;
  backgroundColor: RgbaColor & { hex: string };
  trimmed: TrimmedImage | null;
}

export interface SplitImageIslandsResult {
  width: number;
  height: number;
  backgroundColor: RgbaColor & { hex: string };
  islands: ImageIsland[];
}

export interface SplitImageIslandsInput {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
  backgroundColor?: RgbaColor | readonly [number, number, number, number?];
  tolerance?: number;
  minIslandPixels?: number;
  padding?: number;
  connectivity?: 4 | 8;
}

function clampByte(value: number | undefined, fallback = 255): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(255, Math.round(value)));
}

function normalizeColor(
  color: SplitImageIslandsInput["backgroundColor"],
  data: Uint8ClampedArray | Uint8Array
): RgbaColor & { hex: string } {
  let rgba: RgbaColor;
  if (color && "r" in color) {
    rgba = {
      r: clampByte(color.r, 0),
      g: clampByte(color.g, 0),
      b: clampByte(color.b, 0),
      a: clampByte(color.a, 255),
    };
  } else if (color) {
    const channels = color as readonly [number, number, number, number?];
    rgba = {
      r: clampByte(channels[0], 0),
      g: clampByte(channels[1], 0),
      b: clampByte(channels[2], 0),
      a: clampByte(channels[3], 255),
    };
  } else {
    rgba = {
      r: data[0] ?? 0,
      g: data[1] ?? 0,
      b: data[2] ?? 0,
      a: data[3] ?? 255,
    };
  }

  return {
    ...rgba,
    hex: `#${[rgba.r, rgba.g, rgba.b]
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")}`,
  };
}

function matchesColor(
  data: Uint8ClampedArray | Uint8Array,
  pixelIndex: number,
  color: RgbaColor,
  tolerance: number
): boolean {
  const offset = pixelIndex * 4;
  return (
    Math.abs(data[offset] - color.r) <= tolerance &&
    Math.abs(data[offset + 1] - color.g) <= tolerance &&
    Math.abs(data[offset + 2] - color.b) <= tolerance &&
    Math.abs(data[offset + 3] - color.a) <= tolerance
  );
}

function transparentizedData(
  data: Uint8ClampedArray | Uint8Array,
  background: RgbaColor,
  tolerance: number
): Uint8ClampedArray {
  const next = new Uint8ClampedArray(data);
  for (let index = 0; index < next.length / 4; index += 1) {
    if (matchesColor(data, index, background, tolerance)) {
      next[index * 4 + 3] = 0;
    }
  }
  return next;
}

export function trimImageBackgroundFromRgba(
  input: TrimImageBackgroundInput
): TrimImageBackgroundResult {
  const width = Math.floor(input.width);
  const height = Math.floor(input.height);
  if (width <= 0 || height <= 0) throw new Error("Image dimensions must be positive");
  if (input.data.length < width * height * 4) throw new Error("Image data is smaller than width * height * 4");

  const tolerance = Math.max(0, Math.floor(input.tolerance ?? 0));
  const backgroundColor = normalizeColor(input.backgroundColor, input.data);
  const data = transparentizedData(input.data, backgroundColor, tolerance);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let visiblePixelCount = 0;

  for (let index = 0; index < width * height; index += 1) {
    if (data[index * 4 + 3] === 0) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    visiblePixelCount += 1;
  }

  if (visiblePixelCount === 0) {
    return {
      width,
      height,
      backgroundColor,
      trimmed: null,
    };
  }

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const cropData = new Uint8ClampedArray(cropWidth * cropHeight * 4);
  for (let y = 0; y < cropHeight; y += 1) {
    for (let x = 0; x < cropWidth; x += 1) {
      const sourceOffset = ((minY + y) * width + minX + x) * 4;
      const targetOffset = (y * cropWidth + x) * 4;
      cropData[targetOffset] = data[sourceOffset];
      cropData[targetOffset + 1] = data[sourceOffset + 1];
      cropData[targetOffset + 2] = data[sourceOffset + 2];
      cropData[targetOffset + 3] = data[sourceOffset + 3];
    }
  }

  return {
    width,
    height,
    backgroundColor,
    trimmed: {
      bounds: {
        x: minX,
        y: minY,
        width: cropWidth,
        height: cropHeight,
      },
      data: cropData,
      visiblePixelCount,
    },
  };
}

export function splitImageIslandsFromRgba(
  input: SplitImageIslandsInput
): SplitImageIslandsResult {
  const width = Math.floor(input.width);
  const height = Math.floor(input.height);
  if (width <= 0 || height <= 0) throw new Error("Image dimensions must be positive");
  if (input.data.length < width * height * 4) throw new Error("Image data is smaller than width * height * 4");

  const tolerance = Math.max(0, Math.floor(input.tolerance ?? 0));
  const minIslandPixels = Math.max(1, Math.floor(input.minIslandPixels ?? 1));
  const padding = Math.max(0, Math.floor(input.padding ?? 0));
  const backgroundColor = normalizeColor(input.backgroundColor, input.data);
  const data = transparentizedData(input.data, backgroundColor, tolerance);
  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  const land = new Uint8Array(totalPixels);

  for (let index = 0; index < totalPixels; index += 1) {
    land[index] = matchesColor(input.data, index, backgroundColor, tolerance) ? 0 : 1;
  }

  const neighborDeltas =
    input.connectivity === 8
      ? [
          [-1, -1], [0, -1], [1, -1],
          [-1, 0], [1, 0],
          [-1, 1], [0, 1], [1, 1],
        ]
      : [
          [0, -1],
          [-1, 0],
          [1, 0],
          [0, 1],
        ];
  const islands: ImageIsland[] = [];

  for (let start = 0; start < totalPixels; start += 1) {
    if (!land[start] || visited[start]) continue;

    const stack = [start];
    visited[start] = 1;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let landPixelCount = 0;

    while (stack.length > 0) {
      const current = stack.pop()!;
      const x = current % width;
      const y = Math.floor(current / width);
      landPixelCount += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      for (const [dx, dy] of neighborDeltas) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nextIndex = ny * width + nx;
        if (!land[nextIndex] || visited[nextIndex]) continue;
        visited[nextIndex] = 1;
        stack.push(nextIndex);
      }
    }

    if (landPixelCount < minIslandPixels) continue;

    const left = Math.max(0, minX - padding);
    const top = Math.max(0, minY - padding);
    const right = Math.min(width - 1, maxX + padding);
    const bottom = Math.min(height - 1, maxY + padding);
    const cropWidth = right - left + 1;
    const cropHeight = bottom - top + 1;
    const cropData = new Uint8ClampedArray(cropWidth * cropHeight * 4);

    for (let y = 0; y < cropHeight; y += 1) {
      for (let x = 0; x < cropWidth; x += 1) {
        const sourceOffset = ((top + y) * width + left + x) * 4;
        const targetOffset = (y * cropWidth + x) * 4;
        cropData[targetOffset] = data[sourceOffset];
        cropData[targetOffset + 1] = data[sourceOffset + 1];
        cropData[targetOffset + 2] = data[sourceOffset + 2];
        cropData[targetOffset + 3] = data[sourceOffset + 3];
      }
    }

    islands.push({
      bounds: {
        x: left,
        y: top,
        width: cropWidth,
        height: cropHeight,
      },
      data: cropData,
      landPixelCount,
    });
  }

  return {
    width,
    height,
    backgroundColor,
    islands,
  };
}

export function islandOutputPath(
  sourcePath: string,
  islandNumber: number,
  extensionOverride?: string
): string {
  const normalized = sourcePath.replaceAll("\\", "/");
  const slashIndex = normalized.lastIndexOf("/");
  const directory = slashIndex >= 0 ? normalized.slice(0, slashIndex + 1) : "";
  const filename = slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized;
  const dotIndex = filename.lastIndexOf(".");
  const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  const extension = (extensionOverride ?? (dotIndex > 0 ? filename.slice(dotIndex + 1) : "png"))
    .replace(/^\./, "")
    .toLowerCase();

  return `${directory}${base}-${islandNumber}.${extension || "png"}`;
}

function transparencySafeExtension(value: string): string {
  const normalized = value.replace(/^\./, "").toLowerCase();
  return ["png", "webp", "avif"].includes(normalized) ? normalized : "png";
}

export function trimmedOutputPath(
  sourcePath: string,
  extensionOverride?: string
): string {
  const normalized = sourcePath.replaceAll("\\", "/");
  const slashIndex = normalized.lastIndexOf("/");
  const directory = slashIndex >= 0 ? normalized.slice(0, slashIndex + 1) : "";
  const filename = slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized;
  const dotIndex = filename.lastIndexOf(".");
  const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  const sourceExtension = dotIndex > 0 ? filename.slice(dotIndex + 1) : "png";
  const extension = transparencySafeExtension(extensionOverride ?? sourceExtension);

  return `${directory}${base}-trim.${extension}`;
}
