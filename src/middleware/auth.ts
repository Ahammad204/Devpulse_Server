import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { pool } from "../db";
import config from "../Config";
import type { ROLES } from "../types";
import sendResponse from "../utility/sendresponse";

const auth = (...roles: ROLES[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
     
        return sendResponse(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized access!!",
        
        });
      }

      const decoded = jwt.verify(
        token as string,
        config.jwtSecret as string,
      ) as JwtPayload;

      const userData = await pool.query(
        `
     SELECT * FROM users WHERE email=$1   
        `,
        [decoded.email],
      );


      const user = userData.rows[0];


      if (userData.rows.length === 0) {
       return sendResponse(res, {
          statusCode: 404,
          success: false,
          message: "User not found",
        
        });
      }


      if (roles.length && !roles.includes(user.role)) {
      
         return sendResponse(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden!!,This role have no access!",
        
        });
      }

      req.user= decoded; 
     

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
