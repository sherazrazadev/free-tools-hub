/**
 * Simple luminance threshold: dark ink → near-black, light → white.
 * Optional readability aid - not automatic “background removal”.
 */
export function applyLuminanceThreshold(
  imageData: ImageData,
  threshold: number,
): ImageData {
  const t = Math.min(255, Math.max(0, Math.round(threshold)));
  const out = new ImageData(imageData.width, imageData.height);
  const src = imageData.data;
  const dst = out.data;
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3];
    if (a < 8) {
      dst[i] = 255;
      dst[i + 1] = 255;
      dst[i + 2] = 255;
      dst[i + 3] = 255;
      continue;
    }
    const lum = 0.2126 * src[i] + 0.7152 * src[i + 1] + 0.0722 * src[i + 2];
    const v = lum >= t ? 255 : 0;
    dst[i] = v;
    dst[i + 1] = v;
    dst[i + 2] = v;
    dst[i + 3] = 255;
  }
  return out;
}
