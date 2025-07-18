import { useTranslation } from "@/i18n/useTranslation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useState, useEffect, useRef } from "react";
import { setOrder } from "../checkoutSlice";

function PaymentMethodForm() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const checkoutState = useAppSelector((state) => state.checkoutState);
  const isInitializedRef = useRef(false);

  const [paymentMethod, setPaymentMethod] = useState(
    checkoutState.order.paymentMethod || ""
  );

  // Initialize with a default payment method if none selected
  useEffect(() => {
    if (!isInitializedRef.current) {
      if (checkoutState.order.paymentMethod) {
        setPaymentMethod(checkoutState.order.paymentMethod);
        isInitializedRef.current = true;
        return;
      }

      if (!paymentMethod) {
        const defaultMethod = "creditCard";
        setPaymentMethod(defaultMethod);
        dispatch(
          setOrder({
            ...checkoutState.order,
            paymentMethod: defaultMethod,
          })
        );
      }

      isInitializedRef.current = true;
    }
  }, [checkoutState.order.paymentMethod]);

  const handlePaymentMethodChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const method = e.target.value;
    setPaymentMethod(method);

    dispatch(
      setOrder({
        ...checkoutState.order,
        paymentMethod: method,
      })
    );
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            id="creditCard"
            name="paymentMethod"
            value="creditCard"
            checked={paymentMethod === "creditCard"}
            onChange={handlePaymentMethodChange}
            className="h-4 w-4 text-green-600 dark:text-green-400 border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400"
          />
          <label
            htmlFor="creditCard"
            className="text-gray-600 dark:text-gray-200"
          >
            {t("checkout.creditCard")}
          </label>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            id="paypal"
            name="paymentMethod"
            value="paypal"
            checked={paymentMethod === "paypal"}
            onChange={handlePaymentMethodChange}
            className="h-4 w-4 text-green-600 dark:text-green-400 border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400"
          />
          <label
            htmlFor="paypal"
            className="text-gray-600 dark:text-gray-200"
          >
            {t("checkout.paypal")}
          </label>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            id="bankTransfer"
            name="paymentMethod"
            value="bankTransfer"
            checked={paymentMethod === "bankTransfer"}
            onChange={handlePaymentMethodChange}
            className="h-4 w-4 text-green-600 dark:text-green-400 border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400"
          />
          <label
            htmlFor="bankTransfer"
            className="text-gray-600 dark:text-gray-200"
          >
            {t("checkout.bankTransfer")}
          </label>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-300 italic">
        {t("checkout.paymentInfoText")}
      </p>
    </>
  );
}

export default PaymentMethodForm;
