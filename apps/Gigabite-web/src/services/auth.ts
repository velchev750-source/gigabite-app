import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

import { roles, users, type Role } from "@/db/schema";

export const AUTH_COOKIE_NAME = "gigabite_auth";
const AUTH_EXPIRES_IN = "7d";
const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AuthRole = Role["name"];

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: AuthRole;
};

type AuthTokenPayload = {
  userId: number;
  email: string;
  role: AuthRole;
};

export class AuthError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "AuthError";
  }
}

export function getDashboardPath(role: AuthRole) {
  if (role === "staff") {
    return "/staff";
  }

  if (role === "manager") {
    return "/admin";
  }

  return "/account";
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  phone?: string | null;
  password: string;
  confirmPassword: string;
}) {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone?.trim() || null;

  validateRequired(name, "Name is required.");
  validateEmail(email);
  validateRequired(input.password, "Password is required.");

  if (input.password !== input.confirmPassword) {
    throw new AuthError("Passwords do not match.");
  }

  if (input.password.length < 6) {
    throw new AuthError("Password must be at least 6 characters.");
  }

  const { db } = await import("@/db");
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    throw new AuthError("A user with this email already exists.", 409);
  }

  const [userRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, "user"))
    .limit(1);

  if (!userRole) {
    throw new AuthError("Default user role is missing. Please seed the database.", 500);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const [createdUser] = await db
    .insert(users)
    .values({
      name,
      email,
      phone,
      passwordHash,
      roleId: userRole.id,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
    });

  return {
    ...createdUser,
    role: "user" as const,
  };
}

export async function loginUser(input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);

  validateEmail(email);
  validateRequired(input.password, "Password is required.");

  const user = await getUserByEmail(email);

  if (!user) {
    throw new AuthError("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AuthError("Invalid email or password.", 401);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
}

export function createAuthToken(user: Pick<AuthUser, "id" | "email" | "role">) {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, getJwtSecret(), { expiresIn: AUTH_EXPIRES_IN });
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
    const user = await getUserById(payload.userId);

    if (!user || user.email !== payload.email || user.role !== payload.role) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(role: AuthRole) {
  const user = await requireAuth();

  if (user.role !== role) {
    redirect(getDashboardPath(user.role));
  }

  return user;
}

export async function requireAnyRole(allowedRoles: AuthRole[]) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    redirect(getDashboardPath(user.role));
  }

  return user;
}

async function getUserByEmail(email: string) {
  const { db } = await import("@/db");
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      passwordHash: users.passwordHash,
      role: roles.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.email, email))
    .limit(1);

  return user ?? null;
}

async function getUserById(userId: number) {
  const { db } = await import("@/db");
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: roles.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateEmail(email: string) {
  validateRequired(email, "Email is required.");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError("Enter a valid email address.");
  }
}

function validateRequired(value: string, message: string) {
  if (!value.trim()) {
    throw new AuthError(message);
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production.");
  }

  return "gigabite-development-secret";
}
