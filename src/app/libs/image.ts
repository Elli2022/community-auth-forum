const MAX_BYTES = 400_000;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function parseDataUrl(dataUrl: string): { mime: string; base64: string } {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(
    dataUrl.trim()
  );
  if (!match) {
    throw new Error("Ogiltig bild. Använd JPEG, PNG eller WebP.");
  }
  const mime = match[1].toLowerCase();
  if (!ALLOWED.has(mime)) {
    throw new Error("Ogiltigt bildformat.");
  }
  const base64 = match[2];
  const bytes = Math.ceil((base64.length * 3) / 4);
  if (bytes > MAX_BYTES) {
    throw new Error("Bilden får max vara 400 KB.");
  }
  return { mime, base64 };
}

export function mimeFromDataUrl(dataUrl: string): string {
  const m = /^data:(image\/[^;]+);/i.exec(dataUrl);
  return m ? m[1].toLowerCase() : "image/jpeg";
}
