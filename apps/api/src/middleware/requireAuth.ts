import type { FastifyReply, FastifyRequest } from "fastify";

export interface AuthTokenPayload {
  sub: string;
  email: string;
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: "Not authenticated" });
  }
}

export function getAuthUserId(request: FastifyRequest): string {
  return (request.user as AuthTokenPayload).sub;
}
