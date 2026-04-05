interface ImageUploadOptions {
  maxDimension?: number;
  mimeType?: "image/jpeg" | "image/webp" | "image/png";
  quality?: number;
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const imageUrl = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = imageUrl;
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function renderCanvas(img: HTMLImageElement, options: ImageUploadOptions = {}) {
  const maxDimension = options.maxDimension ?? 1200;
  const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read image");

  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export async function fileToDataUrl(
  file: File,
  options: ImageUploadOptions = {},
): Promise<string> {
  const img = await loadImage(file);
  const canvas = renderCanvas(img, options);
  const mimeType = options.mimeType ?? "image/jpeg";
  const quality = options.quality ?? 0.82;

  if (mimeType === "image/png") {
    return canvas.toDataURL(mimeType);
  }
  return canvas.toDataURL(mimeType, quality);
}

export async function fileToProcessedFile(
  file: File,
  options: ImageUploadOptions = {},
): Promise<File> {
  const img = await loadImage(file);
  const canvas = renderCanvas(img, options);
  const requestedMimeType = options.mimeType ?? "image/jpeg";
  const quality = options.quality ?? 0.82;

  const blob = await new Promise<Blob | null>((resolve) => {
    if (requestedMimeType === "image/png") {
      canvas.toBlob(resolve, requestedMimeType);
      return;
    }
    canvas.toBlob(resolve, requestedMimeType, quality);
  });

  if (!blob || !blob.type) {
    const fallbackBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
    if (!fallbackBlob) throw new Error("Could not process image.");
    const basename = file.name.replace(/\.[^.]+$/, "") || "upload";
    return new File([fallbackBlob], `${basename}.jpg`, { type: "image/jpeg" });
  }

  const mimeType = blob.type as "image/jpeg" | "image/webp" | "image/png";
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const basename = file.name.replace(/\.[^.]+$/, "") || "upload";
  return new File([blob], `${basename}.${extension}`, { type: mimeType });
}
