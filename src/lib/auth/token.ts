import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "simumed_admin";
export const SESSION_TTL_SECONDS = 7 * 24 * 3600;

const key = (secret: string) => new TextEncoder().encode(secret);

export async function signSession(adminId: string, secret: string, ttlSeconds = SESSION_TTL_SECONDS): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(key(secret));
}

export async function verifySession(token: string | undefined | null, secret: string): Promise<{ adminId: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    return payload.sub ? { adminId: payload.sub } : null;
  } catch {
    return null;
  }
}

export function sessionSecret(): string {
  const s = process.env.SESSION_SECRET ?? "";
  if (s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET precisa ter pelo menos 32 caracteres");
    return "dev-only-secret-change-me-0123456789abcdef";
  }
  return s;
}
