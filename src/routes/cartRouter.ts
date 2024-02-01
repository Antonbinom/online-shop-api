import { Router } from "express";
import {
  addProductToCart,
  getCart,
  removeAllProductsFromCart,
  removeProductFromCart,
} from "../controllers/cartController";

const router = Router();

router.get("/", getCart);
router.put("/add-product/:id", addProductToCart);
router.put("/remove-product/:id", removeProductFromCart);
router.put("/clear-cart", removeAllProductsFromCart);

export default router;
