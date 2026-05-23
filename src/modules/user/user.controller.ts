import type { Request, Response } from "express";
import { userService } from "./user.service";
import sendResponse from "../../utility/sendresponse";


const createUser = async (req: Request, res: Response) => {

  try {
    const result = await userService.createUserIntoDB(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User Created successfully!",
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

export const userController = {
  createUser,
};
