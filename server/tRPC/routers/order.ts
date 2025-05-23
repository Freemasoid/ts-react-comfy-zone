import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { z } from "zod";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import { TRPCError } from "@trpc/server";

// Utility function to ensure consistent handling of price precision
const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const orderItemSchema = z.object({
  _id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  name: z.string(),
  price: z.number(),
  image: z.string(),
  quantity: z.number().min(1),
  color: z.string(),
});

const orderSchema = z.object({
  _id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  tax: z.number().min(0),
  shippingFee: z.number().min(0),
  subtotal: z.number().min(0),
  total: z.number().min(0),
  orderItems: z.array(orderItemSchema),
  deliveryAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string(),
    country: z.string(),
    isDefault: z.boolean().optional(),
    _id: z.string().optional(),
  }),
  contactInformation: z.object({
    name: z.string(),
    surname: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
  paymentMethod: z.string(),
  additionalInformation: z.string().optional(),
  status: z
    .enum(["pending", "paid", "delivered", "cancelled"])
    .default("pending"),
  clerkId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const orderRouter = router({
  getAllOrders: adminProcedure.query(async () => {
    try {
      const orders = await Order.find({});

      return orders;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch orders",
        cause: error,
      });
    }
  }),

  getCurrentUserOrders: protectedProcedure.query(async ({ ctx }) => {
    try {
      const orders = await Order.find({ clerkId: ctx.userId });

      return orders;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user orders",
        cause: error,
      });
    }
  }),

  getSingleOrder: protectedProcedure
    .input(z.string().regex(/^[0-9a-fA-F]{24}$/))
    .query(async ({ ctx, input: orderId }) => {
      try {
        const order = await Order.findById({ _id: orderId });

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `No order with id: ${orderId}`,
          });
        }

        if (
          ctx.auth?.orgRole !== "admin" &&
          order.clerkId !== ctx.auth?.userId
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to view this order",
          });
        }

        return order;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch order",
          cause: error,
        });
      }
    }),

  createOrder: protectedProcedure
    .input(orderSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { orderItems, tax, shippingFee, subtotal, total } = input;

        if (!orderItems || orderItems.length < 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Order has no items",
          });
        }

        const processedOrderItems: object[] = [];
        let serverSubtotal = 0;

        for (const item of orderItems) {
          const dbProduct = await Product.findOne({ _id: item._id });

          if (!dbProduct) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `No product with id: ${item._id} was found.`,
            });
          }

          if (dbProduct.price !== item.price) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Invalid price for product: ${dbProduct.name}`,
            });
          }

          if (dbProduct.inventory < item.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Not enough inventory for ${dbProduct.name}. Available: ${dbProduct.inventory}`,
            });
          }

          const { name, price, _id } = dbProduct;

          const singleOrderItem = {
            quantity: item.quantity,
            name,
            price,
            image: item.image,
            _id,
            color: item.color,
          };

          processedOrderItems.push(singleOrderItem);
          serverSubtotal += price * item.quantity;
        }

        serverSubtotal = roundToTwoDecimals(serverSubtotal);

        const serverTax = Math.ceil(serverSubtotal * 0.21);
        const serverShippingFee = serverSubtotal > 200 ? 0 : 25;

        const serverTotal = roundToTwoDecimals(
          serverSubtotal + serverTax + serverShippingFee
        );

        if (
          Math.abs(serverSubtotal - subtotal) > 0.01 ||
          serverTax !== tax ||
          serverShippingFee !== shippingFee ||
          Math.abs(serverTotal - total) > 0.01
        ) {
          throw new TRPCError({
            code: `BAD_REQUEST`,
            message: "Order calculation mismatch. Please try again",
          });
        }

        const order = await Order.create({
          tax: serverTax,
          shippingFee: serverShippingFee,
          subtotal: serverSubtotal,
          total: serverTotal,
          orderItems: processedOrderItems,
          deliveryAddress: input.deliveryAddress,
          contactInformation: input.contactInformation,
          paymentMethod: input.paymentMethod,
          additionalInformation: input.additionalInformation,
          clerkId: ctx.userId,
        });

        for (const item of orderItems) {
          await Product.findByIdAndUpdate(item._id, {
            $inc: { inventory: -item.quantity },
          });
        }

        return order;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order",
          cause: error,
        });
      }
    }),

  updateOrderStatus: adminProcedure
    .input(
      z.object({
        orderId: z.string().regex(/^[0-9a-fA-F]{24}$/),
        orderStatus: z.enum(["pending", "paid", "delivered", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { orderId, orderStatus } = input;

        const order = await Order.findOneAndUpdate(
          { _id: orderId },
          { status: orderStatus },
          { new: true, runValidators: true }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `No order with id: ${orderId}`,
          });
        }

        return order;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update order status",
          cause: error,
        });
      }
    }),

  updateOrder: adminProcedure
    .input(
      z.object({
        orderId: z.string().regex(/^[0-9a-fA-F]{24}$/),
        orderStatus: z.enum(["pending", "paid", "delivered", "cancelled"]),
        deliveryAddress: z.object({
          street: z.string(),
          city: z.string(),
          state: z.string().optional(),
          postalCode: z.string(),
          country: z.string(),
          isDefault: z.boolean().optional(),
          _id: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { orderId, orderStatus, deliveryAddress } = input;

        const order = await Order.findOneAndUpdate(
          { _id: orderId },
          { status: orderStatus, deliveryAddress: deliveryAddress },
          {
            new: true,
            runValidators: true,
          }
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `No order with id: ${orderId}`,
          });
        }

        return order;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update order",
          cause: error,
        });
      }
    }),
});
