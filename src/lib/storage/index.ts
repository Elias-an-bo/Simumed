import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_BYTES = 5 * 1024 * 1024;

async function toWebp(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .webp({ quality: 82 })
    .toBuffer();
}

async function netlifyStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: "fotos", consistency: "strong" });
}

/**
 * Salva uma foto enviada pelo painel e devolve a URL pública.
 * STORAGE_PROVIDER=netlify → Netlify Blobs (servido por /api/fotos/<chave>); senão → public/uploads.
 */
export async function saveProductImage(file: File, sku: string): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error("Foto maior que 5 MB.");
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) throw new Error("Formato não suportado. Use JPG, PNG ou WebP.");
  const webp = await toWebp(Buffer.from(await file.arrayBuffer()));
  const key = `${sku.replace(/[^A-Za-z0-9-]/g, "")}-${Date.now()}-${randomBytes(3).toString("hex")}.webp`;
  if (process.env.STORAGE_PROVIDER === "netlify") {
    const store = await netlifyStore();
    await store.set(key, new Uint8Array(webp).buffer as ArrayBuffer);
    return `/api/fotos/${key}`;
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, key), webp);
  return `/uploads/${key}`;
}

/** Remove o arquivo de uma foto enviada pelo painel (fotos do catálogo inicial ficam no código). */
export async function deleteStoredImage(url: string): Promise<void> {
  try {
    if (url.startsWith("/api/fotos/")) {
      const store = await netlifyStore();
      await store.delete(decodeURIComponent(url.slice("/api/fotos/".length)));
    } else if (url.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", url));
    }
  } catch (e) {
    console.warn("[storage] não foi possível remover", url, e);
  }
}

export async function readBlobImage(key: string): Promise<ArrayBuffer | null> {
  const store = await netlifyStore();
  return (await store.get(key, { type: "arrayBuffer" })) ?? null;
}
