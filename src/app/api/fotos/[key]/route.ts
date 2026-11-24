import { readBlobImage } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[A-Za-z0-9-]+\.webp$/.test(key)) return new Response("not found", { status: 404 });
  const data = await readBlobImage(key).catch(() => null);
  if (!data) return new Response("not found", { status: 404 });
  return new Response(data, { headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" } });
}
