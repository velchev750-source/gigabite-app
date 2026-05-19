import bcrypt from "bcryptjs";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { roles, users, type Role } from "@/db/schema";
import { requireRole } from "@/services/auth";

type CreateManagedUserInput = {
  name: string;
  email: string;
  phone?: string | null;
  password: string;
  confirmPassword: string;
};

export type CreateUserByManagerInput = CreateManagedUserInput & {
  defaultDeliveryAddress?: string | null;
};

export type CreateStaffByManagerInput = CreateManagedUserInput & {
  workLocation: string;
};

export class ManagerUserError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "ManagerUserError";
  }
}

export async function getManageableUsers() {
  await requireRole("manager");

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      defaultDeliveryAddress: users.defaultDeliveryAddress,
      workLocation: users.workLocation,
      role: roles.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .orderBy(asc(roles.name), asc(users.name));
}

export async function createUserByManager(input: CreateUserByManagerInput) {
  await requireRole("manager");

  return createManagedUser({
    ...input,
    role: "user",
    defaultDeliveryAddress: input.defaultDeliveryAddress?.trim() || null,
    workLocation: null,
  });
}

export async function createStaffByManager(input: CreateStaffByManagerInput) {
  await requireRole("manager");

  const workLocation = input.workLocation.trim();
  validateRequired(workLocation, "Work location is required for staff users.");

  return createManagedUser({
    ...input,
    role: "staff",
    defaultDeliveryAddress: null,
    workLocation,
  });
}

async function createManagedUser(
  input: CreateManagedUserInput & {
    role: Extract<Role["name"], "user" | "staff">;
    defaultDeliveryAddress: string | null;
    workLocation: string | null;
  },
) {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone?.trim() || null;

  validateRequired(name, "Name is required.");
  validateEmail(email);
  validateRequired(input.password, "Password is required.");

  if (input.password !== input.confirmPassword) {
    throw new ManagerUserError("Passwords do not match.");
  }

  if (input.password.length < 6) {
    throw new ManagerUserError("Password must be at least 6 characters.");
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new ManagerUserError("A user with this email already exists.", 409);
  }

  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, input.role))
    .limit(1);

  if (!role) {
    throw new ManagerUserError("Required role is missing. Please seed the database.", 500);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const [createdUser] = await db
    .insert(users)
    .values({
      name,
      email,
      phone,
      defaultDeliveryAddress: input.defaultDeliveryAddress,
      workLocation: input.workLocation,
      passwordHash,
      roleId: role.id,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
    });

  return createdUser;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateEmail(email: string) {
  validateRequired(email, "Email is required.");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ManagerUserError("Enter a valid email address.");
  }
}

function validateRequired(value: string, message: string) {
  if (!value.trim()) {
    throw new ManagerUserError(message);
  }
}
