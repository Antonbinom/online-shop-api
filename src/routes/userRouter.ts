import { Router } from "express";
import { auth, signin, signup } from "../controllers/userController";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/auth", auth);

export default router;
