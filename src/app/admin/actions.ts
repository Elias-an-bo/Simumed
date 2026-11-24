"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, requireAdmin } from "@/lib/auth/session";
import { importCosts } from "@/lib/catalog/import-costs";
import { recomputePrices } from "@/lib/catalog/reprice";
import { prisma } from "@/lib/db";
import { onlyDigits } from "@/lib/documents";
import { parseBRLToCents } from "@/lib/money";
import { sendOrderShipped } from "@/lib/orders/emails";
import { ORDER_STATUS_LABEL, type OrderStatusValue } from "@/lib/orders/status";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { deleteStoredImage, saveProductImage } from "@/lib/storage";
import { slugify } from "@/lib/text";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optNum = (v: string) => (v === "" ? null : Number(v.replace(",", ".")));
const refreshStore = () => revalidatePath("/", "layout");

// ---------- login ----------

let dummyHash: string | undefined;

export async function loginAction(_prev: { error?: string; email?: string }, fd: FormData): Promise<{ error?: string; email?: string }> {
  const email = str(fd, "email").toLowerCase();
  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}`, 8, 15 * 60_000)) return { error: "Muitas tentativas. Aguarde 15 minutos.", email };
  const password = String(fd.get("password") ?? "");
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  // sem usuário, compara com um hash qualquer para o tempo de resposta não revelar se o e-mail existe
  dummyHash ??= await bcrypt.hash("senha-inexistente", 12);
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? dummyHash);
  if (!admin || !ok) return { error: "E-mail ou senha incorretos.", email };
  await createSession(admin.id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function changePasswordAction(fd: FormData) {
  const admin = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const row = await prisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await bcrypt.compare(current, row.passwordHash))) redirect("/admin/configuracoes?erro=senha");
  if (next.length < 10) redirect("/admin/configuracoes?erro=senha-curta");
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  redirect("/admin/configuracoes?ok=senha");
}

// ---------- pedidos ----------

const ALLOWED_NEXT: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING_PAYMENT: ["CANCELED"],
  PAID: ["PREPARING", "SHIPPED", "CANCELED"],
  PREPARING: ["SHIPPED", "CANCELED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELED: [],
};

export async function updateOrderStatusAction(orderId: string, fd: FormData) {
  await requireAdmin();
  const next = str(fd, "status") as OrderStatusValue;
  const tracking = str(fd, "trackingCode");
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (!ALLOWED_NEXT[order.status].includes(next)) redirect(`/admin/pedidos/${orderId}?erro=status`);
  if (next === "SHIPPED" && !tracking) redirect(`/admin/pedidos/${orderId}?erro=rastreio`);
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: next,
      ...(tracking ? { trackingCode: tracking } : {}),
      events: { create: { type: "status", message: `Status alterado no painel: ${ORDER_STATUS_LABEL[next]}${tracking ? ` (rastreio ${tracking})` : ""}` } },
    },
    include: { items: true },
  });
  if (next === "SHIPPED") await sendOrderShipped(updated);
  revalidatePath(`/admin/pedidos/${orderId}`);
  redirect(`/admin/pedidos/${orderId}?ok=1`);
}

export async function addOrderNoteAction(orderId: string, fd: FormData) {
  await requireAdmin();
  const note = str(fd, "note").slice(0, 2000);
  if (note) await prisma.orderEvent.create({ data: { orderId, type: "note", message: note } });
  redirect(`/admin/pedidos/${orderId}`);
}

// ---------- orçamentos ----------

export async function updateQuoteAction(quoteId: string, fd: FormData) {
  await requireAdmin();
  const status = z.enum(["NEW", "IN_PROGRESS", "ANSWERED", "WON", "LOST"]).parse(str(fd, "status"));
  await prisma.quoteRequest.update({ where: { id: quoteId }, data: { status, internalNote: str(fd, "internalNote").slice(0, 4000) || null } });
  redirect(`/admin/orcamentos/${quoteId}?ok=1`);
}

// ---------- produtos ----------

const productSchema = z.object({
  name: z.string().trim().min(3, "Nome muito curto.").max(200),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(20_000).optional(),
  categoryId: z.string().min(1),
  costCents: z.number().int().min(0),
  markupPercent: z.number().min(0).max(1000).nullable(),
  availability: z.enum(["IN_STOCK", "ON_ORDER", "ON_REQUEST"]),
  leadTimeDays: z.number().int().min(0).max(365).nullable(),
  weightKg: z.number().min(0).max(1000),
  lengthCm: z.number().min(0).max(1000),
  widthCm: z.number().min(0).max(1000),
  heightCm: z.number().min(0).max(1000),
  warrantyDays: z.number().int().min(0).max(3650),
  active: z.boolean(),
  featured: z.boolean(),
  quoteOnly: z.boolean(),
  freightOnRequest: z.boolean(),
});

function readProductForm(fd: FormData) {
  return productSchema.safeParse({
    name: str(fd, "name"),
    shortDescription: str(fd, "shortDescription") || undefined,
    description: str(fd, "description") || undefined,
    categoryId: str(fd, "categoryId"),
    costCents: parseBRLToCents(str(fd, "cost") || "0"),
    markupPercent: optNum(str(fd, "markupPercent")),
    availability: str(fd, "availability"),
    leadTimeDays: optNum(str(fd, "leadTimeDays")),
    weightKg: Number(str(fd, "weightKg").replace(",", ".") || 0),
    lengthCm: Number(str(fd, "lengthCm").replace(",", ".") || 0),
    widthCm: Number(str(fd, "widthCm").replace(",", ".") || 0),
    heightCm: Number(str(fd, "heightCm").replace(",", ".") || 0),
    warrantyDays: Number(str(fd, "warrantyDays") || 365),
    active: fd.get("active") === "on",
    featured: fd.get("featured") === "on",
    quoteOnly: fd.get("quoteOnly") === "on",
    freightOnRequest: fd.get("freightOnRequest") === "on",
  });
}

export async function saveProductAction(productId: string | null, _prev: { error?: string; savedAt?: string }, fd: FormData): Promise<{ error?: string; savedAt?: string }> {
  await requireAdmin();
  const parsed = readProductForm(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  const d = parsed.data;
  const dimsGiven = d.weightKg > 0 && d.lengthCm > 0 && d.widthCm > 0 && d.heightCm > 0;
  let id = productId;
  if (productId) {
    const before = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    const dimsChanged = before.weightKg !== d.weightKg || before.lengthCm !== d.lengthCm || before.widthCm !== d.widthCm || before.heightCm !== d.heightCm;
    await prisma.product.update({
      where: { id: productId },
      data: { ...d, ...(dimsChanged && dimsGiven ? { dimsEstimated: false } : {}) },
    });
  } else {
    const count = await prisma.product.count();
    let sku = `SM-${String(count + 1).padStart(4, "0")}`;
    while (await prisma.product.findUnique({ where: { sku } })) sku = `SM-${String(Number(sku.slice(3)) + 1).padStart(4, "0")}`;
    let slug = slugify(d.name);
    for (let n = 2; await prisma.product.findUnique({ where: { slug } }); n++) slug = `${slugify(d.name)}-${n}`;
    const created = await prisma.product.create({ data: { ...d, sku, slug } });
    id = created.id;
  }
  const images = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (images.length) {
    const p = await prisma.product.findUniqueOrThrow({ where: { id: id! }, select: { sku: true, name: true, _count: { select: { images: true } } } });
    let pos = p._count.images;
    try {
      for (const file of images.slice(0, 10)) {
        const url = await saveProductImage(file, p.sku);
        await prisma.productImage.create({ data: { productId: id!, url, alt: p.name, position: pos++ } });
      }
    } catch (e) {
      await recomputePrices({ id: id! });
      refreshStore();
      return { error: e instanceof Error ? e.message : "Falha ao enviar foto." };
    }
  }
  await recomputePrices({ id: id! });
  refreshStore();
  if (!productId) redirect(`/admin/produtos/${id}?ok=1`);
  return { savedAt: new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" }) };
}

export async function deleteProductImageAction(imageId: string) {
  await requireAdmin();
  const img = await prisma.productImage.delete({ where: { id: imageId } });
  await deleteStoredImage(img.url);
  refreshStore();
  redirect(`/admin/produtos/${img.productId}`);
}

export async function makeImageMainAction(imageId: string) {
  await requireAdmin();
  const img = await prisma.productImage.findUniqueOrThrow({ where: { id: imageId } });
  const all = await prisma.productImage.findMany({ where: { productId: img.productId }, orderBy: { position: "asc" } });
  const ordered = [img, ...all.filter((i) => i.id !== img.id)];
  await prisma.$transaction(ordered.map((i, pos) => prisma.productImage.update({ where: { id: i.id }, data: { position: pos } })));
  refreshStore();
  redirect(`/admin/produtos/${img.productId}`);
}

// ---------- categorias ----------

export async function saveCategoryMarkupsAction(fd: FormData) {
  await requireAdmin();
  const cats = await prisma.category.findMany({ select: { id: true } });
  for (const c of cats) {
    const raw = str(fd, `markup-${c.id}`);
    const v = optNum(raw);
    if (v !== null && (!Number.isFinite(v) || v < 0 || v > 1000)) continue;
    await prisma.category.update({ where: { id: c.id }, data: { markupPercent: v } });
  }
  const changed = await recomputePrices();
  refreshStore();
  redirect(`/admin/categorias?ok=${changed}`);
}

// ---------- configurações ----------

export async function saveSettingsAction(fd: FormData) {
  await requireAdmin();
  const before = await prisma.settings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  const num = (k: string, min: number, max: number, fallback: number) => {
    const v = Number(str(fd, k).replace(",", "."));
    return Number.isFinite(v) && v >= min && v <= max ? v : fallback;
  };
  const cep = onlyDigits(str(fd, "originCep"));
  const data = {
    companyName: str(fd, "companyName") || "Simumed",
    legalName: str(fd, "legalName") || null,
    cnpj: onlyDigits(str(fd, "cnpj")) || null,
    address: str(fd, "address") || null,
    phone: str(fd, "phone") || null,
    whatsapp: str(fd, "whatsapp") || null,
    email: str(fd, "email") || null,
    instagram: str(fd, "instagram").replace(/^@/, "") || null,
    originCep: cep.length === 8 ? cep : null,
    handlingDays: Math.round(num("handlingDays", 0, 60, before.handlingDays)),
    defaultMarkupPercent: num("defaultMarkupPercent", 0, 1000, before.defaultMarkupPercent),
    pixDiscountPercent: num("pixDiscountPercent", 0, 30, before.pixDiscountPercent),
    maxInstallments: Math.round(num("maxInstallments", 1, 12, before.maxInstallments)),
    quoteThresholdCents: parseBRLToCents(str(fd, "quoteThreshold") || "0") || before.quoteThresholdCents,
  };
  await prisma.settings.update({ where: { id: "default" }, data });
  if (data.defaultMarkupPercent !== before.defaultMarkupPercent) await recomputePrices();
  refreshStore();
  redirect("/admin/configuracoes?ok=1");
}

// ---------- importar custos ----------

export async function importCostsAction(fd: FormData) {
  await requireAdmin();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 2 * 1024 * 1024) redirect("/admin/produtos/importar?erro=arquivo");
  let result: { updated: number; unknown: number; repriced: number };
  try {
    result = await importCosts(await file.text());
  } catch {
    redirect("/admin/produtos/importar?erro=arquivo");
  }
  refreshStore();
  redirect(`/admin/produtos/importar?ok=${result.updated}&precos=${result.repriced}&desconhecidos=${result.unknown}`);
}
