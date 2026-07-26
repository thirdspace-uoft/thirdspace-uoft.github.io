"use client";

import { jwtVerify, SignJWT } from "jose";
import {
  ADMIN_SESSION_SECRET,
  ADMIN_SESSION_TTL_HOURS,
  SESSION_ISSUER,
  SESSION_STORAGE_KEY,
} from "@/lib/admin-credentials";

export type AdminSession = {
  email: string;
  exp: number; // seconds since epoch
};

function secretBytes() {
  return new TextEncoder().encode(ADMIN_SESSION_SECRET);
}

export async function signSession(email: string): Promise<string> {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(SESSION_ISSUER)
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_TTL_HOURS}h`)
    .sign(secretBytes());
}

export async function verifySession(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretBytes(), {
      issuer: SESSION_ISSUER,
    });
    if (typeof payload.email !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    return { email: payload.email, exp: payload.exp };
  } catch {
    return null;
  }
}

export function storeSession(token: string) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, token);
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

export function readStoredSession(): string | null {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}
