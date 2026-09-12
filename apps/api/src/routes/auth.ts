import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "../lib/env.js";
import { requireAuth, getAuthUserId } from "../middleware/requireAuth.js";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

// In local dev the web app is proxied under the same origin, so "lax" is
// enough. In production the frontend and API are on different domains, which
// requires "none" (and, per spec, "none" is only honored when Secure is set -
// hence tying this to COOKIE_SECURE rather than NODE_ENV directly).
const COOKIE_SAME_SITE = env.COOKIE_SECURE ? "none" : "lax";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;

    const existing = await app.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await app.prisma.user.create({
      data: { email, passwordHash },
    });

    const token = await reply.jwtSign({ sub: user.id, email: user.email });
    reply
      .setCookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        path: "/",
        maxAge: COOKIE_MAX_AGE_SECONDS,
      })
      .code(201)
      .send({ id: user.id, email: user.email });
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;

    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const token = await reply.jwtSign({ sub: user.id, email: user.email });
    reply
      .setCookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        path: "/",
        maxAge: COOKIE_MAX_AGE_SECONDS,
      })
      .send({ id: user.id, email: user.email });
  });

  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: "/" }).code(204).send();
  });

  app.get("/auth/me", { preHandler: requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const user = await app.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) {
      return reply.code(401).send({ error: "Not authenticated" });
    }
    reply.send(user);
  });
}
