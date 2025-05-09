import { IUser } from "../models/User.js";
import { IAdmin } from "../models/Admin.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser | IAdmin;
      id?: string;
      auth?: {
        userId: string;
        sessionId: string;
        session: Record<string, unknown>;
        user: {
          id: string;
          firstName?: string;
          lastName?: string;
          emailAddresses?: Array<{
            id: string;
            emailAddress: string;
            verification: Record<string, unknown>;
          }>;
          phone: string;
          [key: string]: unknown;
        };
        organization: Record<string, unknown> | null;
        orgId?: string;
        orgRole?: string;
        orgSlug?: string;
        actor?: Record<string, unknown> | null;
        actorId?: string;
        actorType?: string;
      };
    }
  }
}
export {};
