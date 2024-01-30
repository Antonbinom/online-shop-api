import { Router } from "express";
import {
  update,
  create,
  getAll,
  getOne,
  remove,
} from "../controllers/productController";

const router = Router();

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getOne);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
