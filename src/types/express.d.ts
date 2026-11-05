import type { JwtPayload } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      // Captured by express.json()'s verify hook so the Paystack webhook can
      // hash the exact bytes Paystack signed — a re-serialized req.body
      // would not byte-match and would fail signature verification.
      rawBody?: Buffer;
    }
  }
}

export {};
