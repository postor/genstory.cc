/** 浏览器端占位 PNG 生成（用 Canvas，无需依赖）。 */
export async function makePngBlob(
  width = 320,
  height = 240,
  color: [number, number, number] = [150, 150, 150],
  label = ""
): Promise<Blob> {
  const w = width;
  const h = height;
  let canvas: OffscreenCanvas | HTMLCanvasElement;
  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(w, h);
  } else {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    canvas = c;
  }
  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (ctx) {
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx.fillRect(0, 0, w, h);
    if (label) {
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = `${Math.round(Math.min(w, h) / 8)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, w / 2, h / 2);
    }
  }
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type: "image/png" });
  }
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png"
    );
  });
}
