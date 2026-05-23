import { Router } from "express";
import auth from "../../middleware/auth";
import { issueController } from "./issues.controller";


const router = Router();

router.post("/", auth(), issueController.createIssue);
router.get("/", issueController.getAllIssues);
router.get("/:id", issueController.getSingleIssue);

export const issueRoute = router;