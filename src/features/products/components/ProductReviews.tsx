import { useState, useEffect } from "react";
import { Skeleton, Pagination } from "@/shared/ui";
import { trpc } from "@/trpc/trpc";
import { Review, Product } from "@/trpc/types";
import { keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "@/i18n/useTranslation";
import ReviewCard from "./ReviewCard";
import ProductReviewPopup from "./ProductReviewPopup";
import { useUser } from "@clerk/clerk-react";

interface ProductReviewsProps {
  product: Product;
  productId: string;
}

function ProductReviews({ product, productId }: ProductReviewsProps) {
  const { t, language } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewsPerPage] = useState(4);
  const { user } = useUser();

  const createReview = trpc.review.createReview.useMutation();

  const productName =
    product.name[language as keyof typeof product.name] || product.name.enUS;

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
  } = trpc.review.getSingleProductReviews.useQuery(
    {
      productId: productId,
      pagination: { page: currentPage, limit: reviewsPerPage },
    },
    { enabled: !!productId, placeholderData: keepPreviousData }
  );

  // Review submission handler
  const handleSubmitReview = async (reviewData: {
    rating: number;
    title: string;
    comment: string;
    productId: string;
  }) => {
    try {
      await createReview.mutateAsync({
        product: reviewData.productId,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        userName: user?.firstName || "User",
        userSurname: user?.lastName || "Anonymous",
      });

      console.log("User:", user);
      console.log("Submitting review:", reviewData);

      await refetchReviews();
    } catch (error) {
      console.error("Failed to submit review:", error);
    }
  };

  // Reset page when product changes
  useEffect(() => {
    setCurrentPage(1);
  }, [productId]);

  // Handle reviews data
  const reviews = (reviewsData?.docs as unknown as Review[]) || [];
  const totalPages = reviewsData?.totalPages || 1;

  return (
    <div className="mt-5 mb-5">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-5">
        {t("products.productReviews")}{" "}
        <span className="text-yellow-500 mr-1">★</span>
        <span className="dark:text-green-50">
          {product.averageRating.toFixed(1)}
        </span>
        <span className="text-muted-foreground ml-1">
          ({product.numOfReviews})
        </span>
      </h2>

      <div className="flex justify-center sm:justify-end mb-5">
        <ProductReviewPopup
          productName={productName}
          productId={productId}
          onSubmit={handleSubmitReview}
        />
      </div>

      {reviewsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <Skeleton
                key={index}
                className="h-40 w-full"
              />
            ))}
        </div>
      ) : reviewsError ? (
        <div className="text-center py-10 bg-white rounded-xl border">
          <p className="text-red-500">
            {reviewsError.message || t("common.errorLoadingReviews")}
          </p>
          <button
            className="mt-4 px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90"
            onClick={() => refetchReviews()}
          >
            {t("common.tryAgain")}
          </button>
        </div>
      ) : reviews.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              showNavLabels={false}
              className="mt-8"
            />
          )}
        </>
      ) : (
        <div className="text-center py-10 bg-white rounded-xl border">
          <p className="text-gray-500">{t("products.noReviewsYet")}</p>
          <ProductReviewPopup
            productName={productName}
            productId={productId}
            onSubmit={handleSubmitReview}
          />
        </div>
      )}
    </div>
  );
}

export default ProductReviews;
