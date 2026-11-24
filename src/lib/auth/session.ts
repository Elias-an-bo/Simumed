import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, sessionSecret, signSession, verifySession } from "./token";

export async function createSession(adminId: string) {
  const token = await signSession(adminId, sessionSecret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const s = await verifySession(token, sessionSecret());
  if (!s) return null;
  const admin = await prisma.adminUser.findUnique({ where: { id: s.adminId }, select: { id: true, email: true, name: true } });
  return admin;
}

/** Use em toda página e ação do painel (além do proxy). */
export async function requireAdmin() {
  const admin = await getSession();
  if (!admin) redirect("/admin/login");
  return admin;
}
