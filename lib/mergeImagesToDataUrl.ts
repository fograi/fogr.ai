export async function mergeImagesToDataURL(files: File[]): Promise<string> {
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const images = await Promise.all(
    files.map((file) => loadImage(URL.createObjectURL(file))),
  );

  // Resize images to max width (e.g. 600px) to prevent canvas overflow
  const maxWidth = 600;
  const scaledImages = images.map((img) => {
    const scale = maxWidth / img.width;

    return {
      img,
      width: maxWidth,
      height: img.height * scale,
    };
  });

  const totalHeight = scaledImages.reduce((sum, { height }) => sum + height, 0);
  const canvas = document.createElement("canvas");

  canvas.width = maxWidth;
  canvas.height = totalHeight;

  const ctx = canvas.getContext("2d")!;
  let y = 0;

  for (const { img, width, height } of scaledImages) {
    ctx.drawImage(img, 0, y, width, height);
    y += height;
  }

  // Export to JPEG instead of PNG
  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
  const base64 = dataUrl.split(",")[1];
  const byteLength = Math.ceil((base64.length * 3) / 4);

  console.log("Merged image size (bytes):", byteLength);
  console.log("Canvas dimensions:", canvas.width, "x", canvas.height);

  return dataUrl;
}
