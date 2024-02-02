import { Router } from "express";
import {
  getOrders,
  getOrderByID,
  createOrder,
  resetOrder,
  editOrder,
  confirmOrder,
  cancelConfirmedOrder,
  addProductsToOrder,
  removeProductsFromOrder,
} from "../controllers/orderController";

const router = Router();

router.get("/", getOrders);
router.get("/:id", getOrderByID);
router.post("/create", createOrder);
router.delete("/reset/:id", resetOrder);
router.put("/edit/:id", editOrder);
router.put("/add-products/:id", addProductsToOrder);
router.put("/remove-products/:id", removeProductsFromOrder);
router.put("/confirmation/:id", confirmOrder);
router.put("/cancel/:id", cancelConfirmedOrder);

export default router;
