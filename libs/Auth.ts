import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { JwtPayload } from "jsonwebtoken";
import { hasAccess } from "./Permission";
import { IUser } from "./IInterfaces";
import { createHash } from "crypto";
import { listMenuServer } from "@/components/IMenu";
import prisma from "./Prisma";

const secretKey = new TextEncoder().encode(process.env.APP_KEY || "secretcode");

export async function encrypt(payload: JwtPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secretKey);
}

export async function decrypt(params: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(params, secretKey, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function signIn(user: IUser) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  (await cookies()).set("session", session, { expires });
}

export async function signOut() {
  (await cookies()).set("session", "", { expires: new Date(0) });
}
export async function getSession(): Promise<JwtPayload | null> {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  const result: JwtPayload = await decrypt(session);
  return result;
}

export async function refreshToken(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return NextResponse.redirect(new URL("/", request.url));
  const payload = await getSession();
  if (!payload) return NextResponse.redirect(new URL("/", request.url));
  const user = await prisma.user.findFirst({
    where: { id: payload.user.id },
    include: { Role: true },
  });
  if (!user) return NextResponse.redirect(new URL("/", request.url));

  const pathname = request.nextUrl.pathname;

  if (payload && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const access = hasAccess(user.Role, pathname, "read");
  const menuaccess = listMenuServer.find((f) => f.key === pathname);
  const needaccess = menuaccess ? menuaccess.needaccess : true;
  if (!access && needaccess)
    return NextResponse.redirect(new URL("/unauthorize", request.url));

  return NextResponse.next();
}

export function verifyMitraApiKey(providedKey: string, storedHash: string) {
  const hash = createHash("sha256").update(providedKey).digest("hex");

  return hash === storedHash;
}

export function apiProtect(request: NextRequest, mitraApiHash: string) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) return false;

  return verifyMitraApiKey(apiKey, mitraApiHash);
}
