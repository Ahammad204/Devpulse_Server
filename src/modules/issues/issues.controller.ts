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
const getAllIssues = async (req: Request, res: Response) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
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

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const result = await issueService.getSingleIssueFromDB(id);

    if (!result) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
        data: null,
      });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message || "Something went wrong",
      error,
    });
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
};
