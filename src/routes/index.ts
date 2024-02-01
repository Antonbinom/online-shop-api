import { Router } from "express";
import userRouter from "../routes/userRouter";
import productRouter from "../routes/productRouter";
import cartRouter from "../routes/cartRouter";

const router = Router();

router.use("/user", userRouter);
router.use("/product", productRouter);
router.use("/cart", cartRouter);

export default router;
