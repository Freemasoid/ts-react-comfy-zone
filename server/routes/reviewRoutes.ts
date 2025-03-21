import {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import express from "express";
import { isAdmin } from "../middleware/clerk-user";

const router = express.Router();

router.route("/").get(getAllReviews).post(isAdmin, createReview);

router
  .route("/:id")
  .get(getSingleReview)
  .patch(isAdmin, updateReview)
  .delete(isAdmin, deleteReview);

export { router as reviewRouter };
