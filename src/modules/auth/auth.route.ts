import { Router } from "express";
import { authController } from "./auth.controller";


const router = Router();

router.post("/signup", authController.createUser);
router.post("/login", authController.userLogin);
router.post("/refresh-token", authController.refreshToken);


export const userRoute = router;
