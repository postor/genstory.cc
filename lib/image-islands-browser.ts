"use client";

import {
  islandOutputPath,
  trimImageBackgroundFromRgba,
  splitImageIslandsFromRgba,
  trimmedOutputPath,
  type ImageIsland,
  type RgbaColor,
} from "./image-islands.ts";

export interface SplitImageBlobOptions {
  sourcePath: string;
  blob: Blob;
  backgroundColor?: RgbaColor | readonly [number, number, number, number?];
  tolerance?: number;
  minIslandPixels?: number;
  padding?: number;
  connectivity?: 4 | 8;
  outputExtension?: string;
  outputDirectory?: string;
}

export interface SplitImageBlobIsland {
  path: string;
  blob: Blob;
  bounds: ImageIsland["bounds"];
  landPixelCount: number;
}

export interface SplitImageBlobResult {
  sourcePath: string;
  backgroundColor: RgbaColor & { hex: string };
  islands: SplitImageBlobIsland[];
}

export interface TrimImageBlobOptions {
  sourcePath: string;
  blob: Blob;
  backgroundColor?: RgbaColor | readonly [number, number, number, number?];
  tolerance?: number;
  outputExtension?: string;
  outputDirectory?: string;
}

export interface TrimImageBlobResult {
  sourcePath: string;
  backgroundColor: RgbaColor & { hex: string };
  trimmed: {
    path: string;
    blob: Blob;
    bounds: ImageIsland["bounds"];
    visiblePixelCount: number;
  } | null;
}

function extensionFromPath(path: string): string {
  const filename = path.replaceAll("\\", "/").split("/").pop() ?? "";
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex > 0 ? filename.slice(dotIndex + 1).toLowerCase() : "png";
}

function transparencySafeExtension(extension: string): string {
  return ["png", "webp", "avif"].includes(extension.toLowerCase())
    ? extension.toLowerCase()
    : "png";
}

function mimeForExtension(extension: string): string {
  if (extension === "webp") return "image/webp";
  if (extension === "avif") return "image/avif";
  return "image/png";
}

function extensionForMime(mimeType: string, fallback: string): string {
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/avif") return "avif";
  if (mimeType === "image/png") return "png";
  return fallback;
}

function createCanvas(
  width: number,
  height: number
): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function twoDimensionalContext(canvas: OffscreenCanvas | HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!context) throw new Error("Cannot create a 2D canvas context");
  return context;
}

function canvasToBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  mimeType: string
): Promise<Blob> {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type: mimeType });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Cannot encode island image"));
      }
    }, mimeType);
  });
}

async function imageDataFromBlob(blob: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = createCanvas(bitmap.width, bitmap.height);
    const context = twoDimensionalContext(canvas);
    context.drawImage(bitmap, 0, 0);
    return context.getImageData(0, 0, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

async function blobFromRgba(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  mimeType: string
): Promise<Blob> {
  const canvas = createCanvas(width, height);
  const context = twoDimensionalContext(canvas);
  const imagePixels: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(data.length);
  imagePixels.set(data);
  context.putImageData(
    new ImageData(imagePixels, width, height),
    0,
    0
  );
  return canvasToBlob(canvas, mimeType);
}

async function blobFromIsland(island: ImageIsland, mimeType: string): Promise<Blob> {
  return blobFromRgba(
    island.data,
    island.bounds.width,
    island.bounds.height,
    mimeType
  );
}

function pathInOutputDirectory(
  sourcePath: string,
  islandNumber: number,
  extension: string,
  outputDirectory?: string
): string {
  if (!outputDirectory) return islandOutputPath(sourcePath, islandNumber, extension);
  const filename = islandOutputPath(sourcePath.split(/[\\/]/).pop() ?? sourcePath, islandNumber, extension);
  return `${outputDirectory.replace(/\/+$/, "")}/${filename}`;
}

function trimPathInOutputDirectory(
  sourcePath: string,
  extension: string,
  outputDirectory?: string
): string {
  if (!outputDirectory) return trimmedOutputPath(sourcePath, extension);
  const filename = trimmedOutputPath(
    sourcePath.split(/[\\/]/).pop() ?? sourcePath,
    extension
  );
  return `${outputDirectory.replace(/\/+$/, "")}/${filename}`;
}

export async function splitImageBlobIntoIslandFiles(
  options: SplitImageBlobOptions
): Promise<SplitImageBlobResult> {
  const imageData = await imageDataFromBlob(options.blob);
  const extension = transparencySafeExtension(
    options.outputExtension ?? extensionFromPath(options.sourcePath)
  );
  const mimeType = mimeForExtension(extension);
  const result = splitImageIslandsFromRgba({
    width: imageData.width,
    height: imageData.height,
    data: imageData.data,
    backgroundColor: options.backgroundColor,
    tolerance: options.tolerance,
    minIslandPixels: options.minIslandPixels,
    padding: options.padding,
    connectivity: options.connectivity,
  });

  const islands: SplitImageBlobIsland[] = [];
  for (const [index, island] of result.islands.entries()) {
    const blob = await blobFromIsland(island, mimeType);
    const actualExtension = extensionForMime(blob.type, extension);
    islands.push({
      path: pathInOutputDirectory(
        options.sourcePath,
        index + 1,
        actualExtension,
        options.outputDirectory
      ),
      blob,
      bounds: island.bounds,
      landPixelCount: island.landPixelCount,
    });
  }

  return {
    sourcePath: options.sourcePath,
    backgroundColor: result.backgroundColor,
    islands,
  };
}

export async function trimImageBlobToFile(
  options: TrimImageBlobOptions
): Promise<TrimImageBlobResult> {
  const imageData = await imageDataFromBlob(options.blob);
  const extension = transparencySafeExtension(
    options.outputExtension ?? extensionFromPath(options.sourcePath)
  );
  const mimeType = mimeForExtension(extension);
  const result = trimImageBackgroundFromRgba({
    width: imageData.width,
    height: imageData.height,
    data: imageData.data,
    backgroundColor: options.backgroundColor,
    tolerance: options.tolerance,
  });

  if (!result.trimmed) {
    return {
      sourcePath: options.sourcePath,
      backgroundColor: result.backgroundColor,
      trimmed: null,
    };
  }

  const blob = await blobFromRgba(
    result.trimmed.data,
    result.trimmed.bounds.width,
    result.trimmed.bounds.height,
    mimeType
  );
  const actualExtension = extensionForMime(blob.type, extension);

  return {
    sourcePath: options.sourcePath,
    backgroundColor: result.backgroundColor,
    trimmed: {
      path: trimPathInOutputDirectory(
        options.sourcePath,
        actualExtension,
        options.outputDirectory
      ),
      blob,
      bounds: result.trimmed.bounds,
      visiblePixelCount: result.trimmed.visiblePixelCount,
    },
  };
}
