import { Router } from "express";
import userRouter from "../routes/userRouter";
import productRouter from "../routes/productRouter";

const router = Router();

router.use("/user", userRouter);
router.use("/product", productRouter);

export default router;
