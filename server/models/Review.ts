import mongoose, { Schema, Document, Model } from "mongoose";

interface IProduct extends Document {
  averageRating: number;
  numOfReviews: number;
}

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  clerkId: string;
  product: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  userName: string;
  userSurname: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewModel extends Model<IReview> {
  calcAvgRating(productId: mongoose.Types.ObjectId | string): Promise<void>;
  model(name: string): mongoose.Model<IProduct>;
}

const ReviewSchema = new Schema<IReview, IReviewModel>(
  {
    clerkId: {
      type: String,
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Please provide rating "],
    },
    title: {
      type: String,
      trim: true,
      required: [true, "Please provide review title"],
      maxLength: 200,
    },
    comment: {
      type: String,
      required: [true, "Please provide review text"],
    },
    userName: {
      type: String,
      required: true,
    },
    userSurname: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ product: 1, clerkId: 1 }, { unique: true });

ReviewSchema.statics.calcAvgRating = async function (
  this: IReviewModel,
  productId: mongoose.Types.ObjectId | string
): Promise<void> {
  const result = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        numOfReviews: { $sum: 1 },
      },
    },
  ]);

  try {
    await this.model("Product").findOneAndUpdate(
      { _id: productId },
      {
        averageRating: Math.ceil(result[0].averageRating),
        numOfReviews: result[0]?.numOfReviews || 0,
      }
    );
  } catch (error) {
    console.log(error);
  }
};

ReviewSchema.post<IReview>("save", async function () {
  await (this.constructor as IReviewModel).calcAvgRating(this.product);
});

ReviewSchema.post<IReview>("deleteOne", async function () {
  await (this.constructor as IReviewModel).calcAvgRating(this.product);
});

export default mongoose.model<IReview, IReviewModel>("Review", ReviewSchema);
