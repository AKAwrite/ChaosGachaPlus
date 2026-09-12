import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("14d"),
  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  PORT: z
    .string()
    .default("4000")
    .transform((value) => Number.parseInt(value, 10)),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
});

export const env = envSchema.parse(process.env);
