import { Request, Response } from "express";
import prisma from "../client";
import ApiError from "../helpers/ApiError";
import {
  DeliveryStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { jwtTokenPayload } from "../helpers/jwtTokenPayload";

interface OrderBody {
  id: string;
  deliveryAddress: string;
  depositedAmount: number;
  deliveryCost: number;
  totalCost: number;
  productsCost: number;
  products: string[];
}

const getCart = async (id: string) => {
  return await prisma.cart.findUnique({
    where: {
      userId: id,
    },
  });
};

const updateCart = async (
  id: string,
  cartProducts: string[],
  orderPrducts: string[],
  removeFromCart: boolean
) => {
  return await prisma.cart.update({
    where: {
      id,
    },
    data: {
      products: removeFromCart
        ? [...cartProducts.filter((id) => !orderPrducts.includes(id))]
        : [...cartProducts, ...orderPrducts],
    },
  });
};

export const createOrder = async (req: Request, res: Response) => {
  const payload = await jwtTokenPayload(req.headers["authorization"]);
  if (!payload?.id) {
    return ApiError.internal("Invalid payload");
  }

  const {
    deliveryAddress,
    depositedAmount,
    deliveryCost,
    totalCost,
    productsCost,
    products,
  }: OrderBody = req.body;

  if (!products.length) {
    return ApiError.badRequest("There are no any product in the order");
  }

  const isProductsExists = await prisma.product.findMany({
    where: {
      id: { in: products },
    },
  });

  if (isProductsExists.length !== products.length) {
    return ApiError.internal("Some products does not exist");
  }

  if (productsCost + deliveryCost !== totalCost) {
    return ApiError.badRequest(
      "Total price must be equal to the sum of delivery and products costs"
    );
  }

  const customer = await prisma.user.findUnique({
    where: {
      id: payload.id,
    },
  });

  if (!customer) {
    return ApiError.badRequest(`The customer with ${payload.id} not found`);
  }

  const order = await prisma.order.create({
    data: {
      deliveryAddress,
      depositedAmount,
      deliveryCost,
      deliveryStatus: DeliveryStatus.PENDING,
      totalCost,
      recipient: `${customer.firstName} ${customer.lastName}`,
      paymentStatus: PaymentStatus.PENDING,
      productsCost,
      paymentMethod: PaymentMethod.DEBIT_CARD,
      customerId: customer.id,
      products,
      status: OrderStatus.CART,
    },
  });

  const cart = await getCart(payload.id);

  if (!cart) {
    return ApiError.badRequest(`The cart does not exists`);
  }

  const updatedCart = await updateCart(
    cart.id,
    cart.products,
    order.products,
    true
  );

  // const updatedCustomer = await prisma.user.update({
  //   where: {
  //     id: payload.id,
  //   },
  //   data: {
  //     // ...{
  //     //   orders:..customer.orders, ...order.id]
  //     //     : [ customer.orders?.length
  //     //     ? [....order.id],
  //     // },
  //   },
  // });

  return res.send(updatedCart);
};

export const getOrders = async (req: Request, res: Response) => {
  const payload = await jwtTokenPayload(req.headers["authorization"]);

  if (!payload?.id) {
    return ApiError.internal("Invalid payload");
  }

  const orders = await prisma.order.findMany({
    where: {
      customerId: payload.id,
    },
    select: {
      id: true,
      deliveryAddress: true,
      depositedAmount: true,
      deliveryCost: true,
      deliveryStatus: true,
      totalCost: true,
      recipient: true,
      paymentStatus: true,
      productsCost: true,
      paymentMethod: true,
      products: true,
      status: true,
    },
  });

  return res.send(orders);
};

export const getOrderByID = async (req: Request, res: Response) => {
  const payload = await jwtTokenPayload(req.headers["authorization"]);

  if (!payload?.id) {
    return ApiError.internal("Invalid payload");
  }
  const { id } = req.params;
  const order = await prisma.order.findUnique({
    where: {
      id,
      customerId: payload.id,
    },
    select: {
      id: true,
      deliveryAddress: true,
      depositedAmount: true,
      deliveryCost: true,
      deliveryStatus: true,
      totalCost: true,
      recipient: true,
      paymentStatus: true,
      productsCost: true,
      paymentMethod: true,
      products: true,
      status: true,
    },
  });

  return res.send(order);
};

export const resetOrder = async (req: Request, res: Response) => {
  const payload = await jwtTokenPayload(req.headers["authorization"]);

  if (!payload?.id) {
    return ApiError.internal("Invalid payload");
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: {
      id,
    },
  });

  if (!order) {
    return ApiError.internal(`The order with ID ${id} does not exist`);
  }

  const orderProducts = order.products;
  const cart = await getCart(payload.id);

  if (!cart) {
    return ApiError.badRequest(`The cart does not exists`);
  }

  await updateCart(cart.id, cart.products, orderProducts, false);

  const delitedOrder = await prisma.order.delete({
    where: {
      id,
    },
  });

  return res.send(cart);
};

export const editOrder = async (req: Request, res: Response) => {
  const payload = await jwtTokenPayload(req.headers["authorization"]);

  if (!payload?.id) {
    return ApiError.internal("Invalid payload");
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: {
      id,
    },
  });

  if (!order) {
    return ApiError.internal(`The order with ID ${id} does not exist`);
  }
  const { deliveryAddress, recipient, paymentMethod } = req.body;

  const updatedOrder = await prisma.order.update({
    where: {
      id,
    },
    data: {
      ...(deliveryAddress && { deliveryAddress }),
      ...(recipient && { recipient }),
      ...(paymentMethod && { paymentMethod }),
    },
    select: {
      id: true,
      deliveryAddress: true,
      depositedAmount: true,
      deliveryCost: true,
      deliveryStatus: true,
      totalCost: true,
      recipient: true,
      paymentStatus: true,
      productsCost: true,
      paymentMethod: true,
      products: true,
      status: true,
    },
  });

  return res.send(updatedOrder);
};

export const addProductsToOrder = async (req: Request, res: Response) => {
  const payload = await jwtTokenPayload(req.headers["authorization"]);

  if (!payload?.id) {
    return ApiError.internal("Invalid payload");
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: {
      id,
    },
  });

  if (!order) {
    return ApiError.internal(`The order with ID ${id} does not exist`);
  }

  const { products } = req.body;

  const cart = await getCart(payload.id);

  if (!cart) {
    return ApiError.badRequest(`The cart does not exists`);
  }

  await updateCart(cart.id, cart.products, products, true);

  const updatedOrder = await prisma.order.update({
    where: {
      id,
    },
    data: {
      products: [...order.products, ...products],
    },
    select: {
      id: true,
      deliveryAddress: true,
      depositedAmount: true,
      deliveryCost: true,
      deliveryStatus: true,
      totalCost: true,
      recipient: true,
      paymentStatus: true,
      productsCost: true,
      paymentMethod: true,
      products: true,
      status: true,
    },
  });

  return res.send(updatedOrder);
};

export const removeProductsFromOrder = async (req: Request, res: Response) => {
  const payload = await jwtTokenPayload(req.headers["authorization"]);

  if (!payload?.id) {
    return ApiError.internal("Invalid payload");
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: {
      id,
    },
  });

  if (!order) {
    return ApiError.internal(`The order with ID ${id} does not exist`);
  }

  const { products } = req.body;

  const cart = await getCart(payload.id);

  if (!cart) {
    return ApiError.badRequest(`The cart does not exists`);
  }

  await updateCart(cart.id, cart.products, products, false);

  const updatedOrder = await prisma.order.update({
    where: {
      id,
    },
    data: {
      products: [...order.products, ...products],
    },
    select: {
      id: true,
      deliveryAddress: true,
      depositedAmount: true,
      deliveryCost: true,
      deliveryStatus: true,
      totalCost: true,
      recipient: true,
      paymentStatus: true,
      productsCost: true,
      paymentMethod: true,
      products: true,
      status: true,
    },
  });

  return res.send(updatedOrder);
};

export const confirmOrder = async (req: Request, res: Response) => {
  const payload = await jwtTokenPayload(req.headers["authorization"]);

  if (!payload?.id) {
    return ApiError.internal("Invalid payload");
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: {
      id,
    },
  });

  if (!order) {
    return ApiError.internal(`The order with ID ${id} does not exist`);
  }

  const { paymentStatus } = req.body;

  const updatedOrder = await prisma.order.update({
    where: {
      id,
    },
    data: {
      ...(paymentStatus && { paymentStatus }),
      status: OrderStatus.CREATED,
    },
    select: {
      id: true,
      deliveryAddress: true,
      depositedAmount: true,
      deliveryCost: true,
      deliveryStatus: true,
      totalCost: true,
      recipient: true,
      paymentStatus: true,
      productsCost: true,
      paymentMethod: true,
      products: true,
      status: true,
    },
  });

  return res.send(updatedOrder);
};

export const cancelConfirmedOrder = async (req: Request, res: Response) => {
  const payload = await jwtTokenPayload(req.headers["authorization"]);

  if (!payload?.id) {
    return ApiError.internal("Invalid payload");
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: {
      id,
    },
  });

  if (!order) {
    return ApiError.internal(`The order with ID ${id} does not exist`);
  }

  const updatedOrder = await prisma.order.update({
    where: {
      id,
    },
    data: {
      status: OrderStatus.CANCELED,
    },
    select: {
      id: true,
      deliveryAddress: true,
      depositedAmount: true,
      deliveryCost: true,
      deliveryStatus: true,
      totalCost: true,
      recipient: true,
      paymentStatus: true,
      productsCost: true,
      paymentMethod: true,
      products: true,
      status: true,
    },
  });

  return res.send(updatedOrder);
};
