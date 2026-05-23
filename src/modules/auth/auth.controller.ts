import type { Request, Response } from "express";
import { userService } from "./auth.service";
import sendResponse from "../../utility/sendresponse";


const createUser = async (req: Request, res: Response) => {

  try {
    const result = await userService.createUserIntoDB(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};
const userLogin = async (req: Request, res: Response) => {

  try {
    const result = await userService.loginUserIntoDB(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const userController = {
  createUser,
  userLogin
};
