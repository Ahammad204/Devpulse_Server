import { Router } from "express";
import { userController } from "./auth.controller";


const router = Router();

router.post("/signup", userController.createUser);
router.post("/login", userController.userLogin);


export const userRoute = router;
