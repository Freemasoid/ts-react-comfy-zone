import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import "../types/clerk";

// This middleware will be used after Clerk's requireAuth middleware
// It will check if the authenticated Clerk user exists in our database
export const syncClerkUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve().then(async () => {
    try {
      if (!req.auth || !req.auth.userId) {
        return next();
      }

      const clerkUserId = req.auth.userId;

      const user = await User.findOne({ clerkId: clerkUserId });

      if (!user) {
        return res.status(403).json({
          success: false,
          message:
            "Please complete registration before you will be able to access this resource.",
          code: "REGISTRATION_REQUIRED",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });
};
