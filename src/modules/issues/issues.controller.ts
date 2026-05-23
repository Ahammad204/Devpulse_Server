
import type { Request, Response } from "express";
import { issueService } from "./issues.service";
import sendResponse from "../../utility/sendresponse";


const createIssue = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    const result = await issueService.createIssueIntoDB(req.body, user?.id);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error,
    });
  }
};

export const issueController = {
  createIssue,
};