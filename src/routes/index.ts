import { Router } from "express";
import userRouter from "../routes/userRouter";
import productRouter from "../routes/productRouter";
import cartRouter from "../routes/cartRouter";
import orderRouter from "../routes/orderRouter";

const router = Router();

router.use("/user", userRouter);
router.use("/product", productRouter);
router.use("/cart", cartRouter);
router.use("/order", orderRouter);

export default router;
