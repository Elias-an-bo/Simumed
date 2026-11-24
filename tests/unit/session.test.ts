import { describe, expect, it } from "vitest";
import { signSession, verifySession } from "@/lib/auth/token";

const secret = "segredo-de-teste-com-pelo-menos-32-caracteres!";

describe("sessão do painel", () => {
  it("token válido devolve o id do administrador", async () => {
    const token = await signSession("admin-1", secret, 3600);
    expect(await verifySession(token, secret)).toEqual({ adminId: "admin-1" });
  });
  it("token adulterado é rejeitado", async () => {
    const token = await signSession("admin-1", secret, 3600);
    const [h, p, s] = token.split(".");
    const forged = [h, Buffer.from(JSON.stringify({ sub: "outro" })).toString("base64url"), s].join(".");
    expect(await verifySession(forged, secret)).toBeNull();
    expect(await verifySession(token.slice(0, -2) + "xx", secret)).toBeNull();
  });
  it("token expirado é rejeitado", async () => {
    const token = await signSession("admin-1", secret, -10);
    expect(await verifySession(token, secret)).toBeNull();
  });
  it("segredo diferente é rejeitado; lixo também", async () => {
    const token = await signSession("admin-1", secret, 3600);
    expect(await verifySession(token, "outro-segredo-com-mais-de-32-caracteres!!")).toBeNull();
    expect(await verifySession("lixo", secret)).toBeNull();
    expect(await verifySession(undefined, secret)).toBeNull();
  });
});
