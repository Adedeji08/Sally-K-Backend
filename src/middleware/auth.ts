import type { NextFunction, Request, Response } from "express";
import type { Role } from "../../generated/prisma/enums.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Authentication token missing"));
  }

  const token = header.slice("Bearer ".length);

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }

    next();
  };
}
