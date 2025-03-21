import {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} from "../controllers/productController.js";
import { getSingleProductReviews } from "../controllers/reviewController.js";
import { isAdmin } from "../middleware/clerk-user";
import express from "express";

const router = express.Router();

router.route("/").post(isAdmin, createProduct).get(getAllProducts);

router.route("/uploadImage").post(isAdmin, uploadImage);

router
  .route("/:id")
  .get(getSingleProduct)
  .patch(isAdmin, updateProduct)
  .delete(isAdmin, deleteProduct);

router.route("/:id/reviews").get(getSingleProductReviews);

export { router as productRouter };
