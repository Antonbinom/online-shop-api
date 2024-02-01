import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../client";
import ApiError from "../helpers/ApiError";

interface Payload {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  showAge: boolean;
}

const jwtTokenPayload = async (bearerToken: string | undefined) => {
  if (!bearerToken) {
    return ApiError.badRequest("The Berarer token is required");
  }

  const token = bearerToken.split(" ")[1];
  const payload = jwt.decode(token) as Payload;

  if (!payload.id) {
    return ApiError.internal("Invalid payload");
  }

  const cart = await prisma.cart.findUnique({
    where: {
      userId: payload.id,
    },
  });

  return cart;
};

const getProduct = async (id: string) => {
  return await prisma.product.findUnique({
    where: {
      id,
    },
  });
};

export const getCart = async (req: Request, res: Response) => {
  const cart = await jwtTokenPayload(req.headers["authorization"]);

  if (!cart) {
    return ApiError.internal("The cart with this id does not exist");
  }

  return res.send(cart);
};

export const addProductToCart = async (req: Request, res: Response) => {
  const cart = await jwtTokenPayload(req.headers["authorization"]);

  if (!cart) {
    return ApiError.internal("The cart with this id does not exist");
  }

  const { id } = req.params;
  const product = await getProduct(id);

  if (!product) {
    return ApiError.internal("The product with this id does not exist");
  }

  const updatedCart = await prisma.cart.update({
    where: {
      id: cart.id,
    },
    data: {
      products: [...cart.products, product.id],
    },
  });

  return res.send(updatedCart);
};
export const removeProductFromCart = async (req: Request, res: Response) => {
  const cart = await jwtTokenPayload(req.headers["authorization"]);

  if (!cart) {
    return ApiError.internal("The cart with this id does not exist");
  }

  const { id } = req.params;
  const product = await getProduct(id);

  if (!cart.products.length) {
    return ApiError.internal("There are no any products in the cart");
  }

  if (!product) {
    return ApiError.internal("The product with this id does not exist");
  }

  const updatedCart = await prisma.cart.update({
    where: {
      id: cart.id,
    },
    data: {
      products: cart.products.filter((p) => p !== product.id),
    },
  });

  return res.send(updatedCart);
};
export const removeAllProductsFromCart = async (
  req: Request,
  res: Response
) => {
  return res.send("removeAllProductsFromCart");
};
