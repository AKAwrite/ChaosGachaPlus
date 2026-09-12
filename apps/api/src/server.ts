import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import { env } from "./lib/env.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { authRoutes } from "./routes/auth.js";
import { storyRoutes } from "./routes/stories.js";
import { characterRoutes } from "./routes/characters.js";
import { ticketRoutes } from "./routes/tickets.js";
import { pullRoutes } from "./routes/pulls.js";
import { inventoryRoutes } from "./routes/inventory.js";
import { entryRoutes } from "./routes/entries.js";
import { historyRoutes } from "./routes/history.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.WEB_ORIGIN,
  credentials: true,
});

await app.register(cookie);

await app.register(jwt, {
  secret: env.JWT_SECRET,
  sign: { expiresIn: env.JWT_EXPIRES_IN },
  cookie: { cookieName: "token", signed: false },
});

await app.register(prismaPlugin);

app.get("/health", async () => ({ status: "ok" }));

await app.register(authRoutes);
await app.register(storyRoutes);
await app.register(characterRoutes);
await app.register(ticketRoutes);
await app.register(pullRoutes);
await app.register(inventoryRoutes);
await app.register(entryRoutes);
await app.register(historyRoutes);

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
