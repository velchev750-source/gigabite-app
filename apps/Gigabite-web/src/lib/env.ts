import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
});

const jwtEnvSchema = z.object({
  JWT_SECRET: z.string().min(1).optional(),
  NODE_ENV: z.string().optional(),
});

const publicAppEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
});

export function getDatabaseUrl() {
  return databaseEnvSchema.parse(process.env).DATABASE_URL;
}

export function getJwtSecret() {
  const env = jwtEnvSchema.parse(process.env);

  if (env.JWT_SECRET) {
    return env.JWT_SECRET;
  }

  if (env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production.");
  }

  return "gigabite-development-secret";
}

export function getPublicAppUrl() {
  const env = publicAppEnvSchema.parse(process.env);

  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}
