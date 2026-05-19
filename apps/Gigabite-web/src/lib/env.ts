import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
});

const jwtEnvSchema = z.object({
  JWT_SECRET: z.string().min(1).optional(),
  NODE_ENV: z.string().optional(),
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
