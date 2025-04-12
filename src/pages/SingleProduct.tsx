import { useState } from "react";
import { Image, Skeleton } from "@/shared/ui";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Plus,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/utils/utils";
import { trpc } from "@/trpc/trpc";
import { Review, Product } from "@/trpc/types";
import { useParams } from "react-router-dom";

export default function SingleProduct() {
  const { id } = useParams<{ id: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [openSection, setOpenSection] = useState<string>("description");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch the product - pass ID directly as a string
  const {
    data: productData,
    isLoading: productLoading,
    error: productError,
  } = trpc.product.getById.useQuery(id || "", {
    enabled: !!id,
    retry: false,
  });

  // Type assertion for the product
  const product = productData as Product;
  console.log(product);

  // Fetch reviews for the product
  const { data: reviewsData, isLoading: reviewsLoading } =
    trpc.review.getSingleProductReviews.useQuery(
      {
        productId: id || "",
        pagination: { page: currentPage, limit: 4 },
      },
      { enabled: !!id }
    );

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? "" : section);
  };

  // Handle loading state
  if (productLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Handle error state
  if (productError || !product) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500">
          Error loading product
        </h2>
        <p className="text-gray-600">
          {productError?.message || "Product not found"}
        </p>
      </div>
    );
  }

  // Handle reviews data
  const reviews = (reviewsData?.docs as unknown as Review[]) || [];
  const totalPages = reviewsData?.totalPages || 1;

  return (
    <div className="bg-background min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Left Column - Title and Thumbnails */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              {product.name}
            </h1>

            <div className="grid grid-cols-3 gap-2">
              {product.images
                .slice(0, 3)
                .map((image: string, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      "bg-white rounded-lg overflow-hidden cursor-pointer aspect-[3/4] relative",
                      selectedImage === index && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedImage(index)}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      objectFit="fill"
                      className="object-cover"
                    />
                  </div>
                ))}
            </div>

            {product.images.length > 3 && (
              <button className="text-primary font-medium flex items-center gap-1 mx-auto">
                MORE +{product.images.length - 3}{" "}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Middle Column - Main Image */}
          <div className="bg-white rounded-2xl overflow-hidden aspect-[4/5] relative">
            <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded-md">
              <div className="text-primary font-bold text-xl">
                {product.company.substring(0, 2).toUpperCase()}
              </div>
            </div>
            <Image
              src={product.images[selectedImage] || "/placeholder.svg"}
              alt={product.name}
              objectFit="fill"
              className="object-cover"
              priority
            />
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="text-gray-500">
                  SKU: {product._id.substring(0, 8)}
                </div>

                <div>
                  <div className="text-gray-500 mb-2">Color</div>
                  <div className="flex gap-2">
                    {product.colors.map((color: string, index: number) => (
                      <button
                        key={index}
                        className={cn(
                          "w-6 h-6 rounded-full border",
                          selectedColor === index &&
                            "ring-2 ring-offset-2 ring-primary"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(index)}
                        aria-label={`Select color ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold">
                ${product.price.toFixed(2)}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="bg-primary hover:bg-primary/90 text-white rounded-full px-4 py-2 flex items-center gap-1 flex-1 justify-center font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Add to Cart
              </button>
              <button className="bg-primary/10 hover:bg-primary/20 text-primary rounded-full p-2 aspect-square flex items-center justify-center transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            {/* Accordion Sections */}
            <div className="space-y-3">
              <div className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex justify-between items-center p-4 bg-white"
                  onClick={() => toggleSection("description")}
                >
                  <span className="font-medium">DESCRIPTION</span>
                  {openSection === "description" ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                {openSection === "description" && (
                  <div className="p-4 bg-white text-gray-600">
                    <p>{product.description}</p>
                  </div>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex justify-between items-center p-4 bg-white"
                  onClick={() => toggleSection("details")}
                >
                  <span className="font-medium">PRODUCT DETAILS</span>
                  {openSection === "details" ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                {openSection === "details" && (
                  <div className="p-4 bg-white text-gray-600">
                    <p className="capitalize">Category: {product.category}</p>
                    <p>Company: {product.company}</p>
                    <p>Inventory: {product.inventory} units available</p>
                  </div>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex justify-between items-center p-4 bg-white"
                  onClick={() => toggleSection("shipping")}
                >
                  <span className="font-medium">SHIPPING & RETURNS</span>
                  {openSection === "shipping" ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                {openSection === "shipping" && (
                  <div className="p-4 bg-white text-gray-600">
                    <p>
                      Free shipping on orders over $50. Standard delivery in 3-5
                      business days.
                    </p>
                    <p>Returns accepted within 30 days of purchase.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20 mb-10">
          <h2 className="text-3xl font-bold text-center mb-10">
            Reviews ({product.averageRating.toFixed(1)})
          </h2>

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
          ) : reviews.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="bg-white rounded-lg p-6 border"
                  >
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {review.user?.toUpperCase() || "Anonymous"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <span
                                key={i}
                                className={
                                  i < review.rating
                                    ? "text-primary"
                                    : "text-gray-300"
                                }
                              >
                                ★
                              </span>
                            ))}
                        </div>
                        <span className="text-gray-400 text-sm">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-medium mb-1">{review.title}</h4>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-8">
                  <button
                    className="flex items-center gap-2 font-medium"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ArrowLeft className="w-5 h-5" /> PREVIOUS
                  </button>
                  <div className="flex gap-2">
                    {Array(totalPages)
                      .fill(0)
                      .map((_, i) => (
                        <button
                          key={i}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            currentPage === i + 1
                              ? "bg-primary text-white"
                              : "bg-white text-gray-600 border"
                          )}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                  </div>
                  <button
                    className="flex items-center gap-2 font-medium"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    NEXT <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg border">
              <p className="text-gray-500">No reviews yet for this product.</p>
              <button className="mt-4 px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90">
                Be the first to review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
