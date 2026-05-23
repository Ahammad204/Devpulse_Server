import type { Request, Response } from "express";
import { issueService } from "./issues.service";
import sendResponse from "../../utility/sendresponse";
import type { IUser } from "../auth/auth.interface";

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

const updateIssue = async (req: Request, res: Response) => {
  try {
    const issueId = parseInt(String(req.params.id), 10);
    const user = req.user as IUser & { id: number };

    if (isNaN(issueId)) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
        data: null,
      });
    }

    const result = await issueService.updateIssueIntoDB(
      issueId,
      user,
      req.body,
    );

    if (!result) {
      return sendResponse(res, {
        statusCode: 403,
        success: false,
        message: "Not allowed to update this issue",
        data: null,
      });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
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


const deleteIssue = async (req: Request, res: Response) => {
  try {
    const issueId = parseInt(String(req.params.id), 10);

    if (isNaN(issueId)) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
        data: null,
      });
    }

    const user = req.user;

    if (!user) {
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized",
        data: null,
      });
    }

    const result = await issueService.deleteIssueFromDB(issueId, user);

    if (!result) {
      return sendResponse(res, {
        statusCode: 403,
        success: false,
        message: "Only maintainer can delete issues",
        data: null,
      });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
      data: null,
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
  updateIssue,
  deleteIssue
};
