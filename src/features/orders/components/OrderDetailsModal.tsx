import { useTranslation } from "@/i18n/useTranslation";
import { ArrowUpRight, MapPin, Phone, Mail, User, Info } from "lucide-react";
import { Order } from "@/trpc/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/shared/ui";

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  const { t, language } = useTranslation();

  const formatDate = (dateInput: Date | string | undefined) => {
    if (!dateInput) return "";

    const localeMap: Record<string, string> = {
      enUS: "en-US",
      deDE: "de-DE",
      ruRU: "ru-RU",
    };

    const locale = localeMap[language] || "en-US";
    const dateObj = new Date(dateInput);

    return dateObj.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatStatus = (status: string) => {
    if (!status) return status;

    const statusKey = status.toLowerCase() as
      | "pending"
      | "failed"
      | "paid"
      | "delivered"
      | "cancelled";
    return t(`orders.status.${statusKey}`);
  };

  const formatCurrency = (amount: number | string) => {
    if (typeof amount === "string") {
      return amount;
    }
    return `${amount.toFixed(2)} €`.replace(".", ",");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-600 dark:bg-green-500 text-white";
      case "pending":
        return "bg-yellow-600 dark:bg-yellow-500 text-white";
      case "cancelled":
      case "failed":
        return "bg-red-600 dark:bg-red-500 text-white";
      case "delivered":
        return "bg-green-600 dark:bg-green-500 text-white";
      default:
        return "bg-gray-200 dark:bg-green-700 text-gray-800 dark:text-gray-200";
    }
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "creditCard":
        return t("orders.creditCard");
      case "paypal":
        return t("orders.paypal");
      case "bankTransfer":
        return t("orders.bankTransfer");
      default:
        return method;
    }
  };

  if (!order) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="bg-green-50 dark:bg-green-900/20 bg-opacity-50 border-b border-green-100 dark:border-green-800 p-6">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-base sm:text-2xl font-medium text-gray-900 dark:text-white">
                {t("orders.orderDetails")}
                <br /> #{order._id}
              </DialogTitle>
              <p className="text-gray-600 dark:text-gray-200 mt-2">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Order Summary */}
        <div className="p-6 border-b border-green-100 dark:border-green-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t("orders.orderSummary")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t("orders.fulfillmentStatus")}
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order.status || ""
                )}`}
              >
                {formatStatus(order.status || "")}
              </span>
            </div>

            {order.paymentMethod && (
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t("orders.paymentMethod")}
                </p>
                <p className="text-gray-600 dark:text-gray-200">
                  {formatPaymentMethod(order.paymentMethod)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <div className="p-6 border-b border-green-100 dark:border-green-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t("orders.deliveryAddress")}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <p className="text-gray-600 dark:text-gray-200">
                {order.deliveryAddress.street}
              </p>
              <p className="text-gray-600 dark:text-gray-200">
                {`${order.deliveryAddress.postalCode} ${order.deliveryAddress.city}`}
                {order.deliveryAddress.state &&
                  `, ${order.deliveryAddress.state}`}
              </p>
              <p className="text-gray-600 dark:text-gray-200">
                {order.deliveryAddress.country}
              </p>
            </div>
          </div>
        )}

        {/* Contact Information */}
        {order.contactInformation && (
          <div className="p-6 border-b border-green-100 dark:border-green-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t("orders.contactInformation")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t("orders.name")}
                </p>
                <p className="text-gray-600 dark:text-gray-200">
                  {`${order.contactInformation.name} ${order.contactInformation.surname}`}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {t("orders.phone")}
                </p>
                <p className="text-gray-600 dark:text-gray-200">
                  {order.contactInformation.phone}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {t("orders.email")}
                </p>
                <p className="text-gray-600 dark:text-gray-200">
                  {order.contactInformation.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        {order.additionalInformation && (
          <div className="p-6 border-b border-green-100 dark:border-green-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              {t("orders.additionalInformation")}
            </h3>
            <p className="text-gray-600 dark:text-gray-200 whitespace-pre-line">
              {order.additionalInformation}
            </p>
          </div>
        )}

        {/* Order Items */}
        <div className="p-6 border-b border-green-100 dark:border-green-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t("orders.orderItems")}
          </h3>

          <div className="space-y-4">
            {order.orderItems?.map((item, index) => (
              <div
                key={index}
                className="bg-green-50 dark:bg-green-900/20 bg-opacity-50 rounded-lg border border-green-100 dark:border-green-800 p-4"
              >
                <div className="flex flex-col md:flex-row items-start gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-grow">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </h4>

                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-200">
                          {t("orders.color")}
                        </span>
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>

                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-200">
                          {t("orders.quantity")}:{" "}
                          <span className="text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                        </span>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-200">
                          {t("orders.price")}:{" "}
                          <span className="text-green-600 dark:text-green-100 font-medium">
                            {formatCurrency(item.price)}
                          </span>
                        </span>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-200">
                          {t("orders.total")}:{" "}
                          <span className="text-green-600 dark:text-green-100 font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Totals */}
        <div className="p-6 border-b border-green-100 dark:border-green-800">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-200">
                {t("orders.subtotal")}
              </span>
              <span className="text-gray-900 dark:text-white">
                {formatCurrency(order.subtotal)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-200">
                {t("orders.tax")}
              </span>
              <span className="text-gray-900 dark:text-white">
                {formatCurrency(order.tax)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-200">
                {t("orders.shipping")}
              </span>
              <span className="text-gray-900 dark:text-white">
                {formatCurrency(order.shippingFee)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-green-100 dark:border-green-800">
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                {t("orders.total")}
              </span>
              <span className="text-lg font-medium text-green-600 dark:text-green-100">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-900/30 transition-colors font-medium flex items-center gap-2"
            >
              {t("common.close")}
              <ArrowUpRight className="h-5 w-5" />
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OrderDetailsModal;
