import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utility/sendresponse";

const createUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.createUserIntoDB(req.body);

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
    const result = await authService.loginUserIntoDB(req.body);

    const { refreshToken , token, user } = result;

    res.cookie("refreshToken", refreshToken, {
      secure: true, 
      httpOnly: true,
      sameSite: "lax",
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: {token,user}
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

const refreshToken = async (req: Request, res: Response) => {
  try {
    const result = await authService.generateFreshToken(
      req.cookies.refreshToken,
    );
    res.status(200).json({
      success: true,
      message: "Access token generated!",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const authController = {
  createUser,
  userLogin,
  refreshToken
};
