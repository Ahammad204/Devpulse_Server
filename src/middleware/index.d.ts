import type { JwtPayload } from "jsonwebtoken";
import type { IIssueQuery } from "../modules/issues/issues.interface";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
       query: IIssueQuery;
    }
    
  }
}
export {};