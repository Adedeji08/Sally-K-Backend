import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Role } from "../../generated/prisma/enums.js";

export interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  role: Role;
}

export function signToken(payload: JwtPayload) {
  const options = { expiresIn: env.JWT_EXPIRES_IN } as unknown as jwt.SignOptions;
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
