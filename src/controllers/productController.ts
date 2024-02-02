import { Age, Color, Season, Sex, Size } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import prisma from "../client";
import ApiError from "../helpers/ApiError";

interface Product {
  name: string;
  brand: string;
  country: string;
  material: string[];
  size?: Size;
  availableSizes?: Size[];
  hight?: number;
  width?: number;
  depth?: number;
  weight: number;
  color: Color;
  availableColors: Color[];
  season?: Season[];
  sex?: Sex[];
  age?: Age[];
  description: string;
  type: string;
  price: number;
  avalableQuantity: number;
}

interface ProductFilters {
  name?: string;
  brand?: string;
  country?: string;
  type?: string;
  color?: Color;
  price?: number;
  minPrice?: string;
  maxPrice?: string;
}

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    brand,
    country,
    material,
    size,
    availableSizes,
    hight,
    width,
    depth,
    weight,
    color,
    availableColors,
    season,
    sex,
    age,
    description,
    type,
    price,
    availableQuantity,
  } = req.body;

  const product = await prisma.product.create({
    data: {
      name: name.toLowerCase(),
      brand: brand.toLowerCase(),
      country: country.toLowerCase(),
      material,
      ...(size && { size }),
      ...(availableSizes?.length && { availableSizes }),
      ...(hight && { hight }),
      ...(width && { width }),
      ...(depth && { depth }),
      ...(season && { season }),
      ...(sex && { sex }),
      ...(age && { age }),
      availableQuantity,
      weight,
      color,
      availableColors,
      description,
      type: type.toLowerCase(),
      price,
    },
  });

  return res.send(product);
};

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    brand,
    country,
    type,
    color,
    name,
    season,
    material,
    age,
    sex,
    size,
    minPrice,
    maxPrice,
    availableQuantity,
  } = req.query;

  const filters = {
    ...(brand && { brand }),
    ...(country && { country }),
    ...(type && { type }),
    ...(name && { name }),
    ...(season && {
      season: {
        hasEvery: Array.isArray(season) ? season : [season],
      },
    }),
    ...(color && !Array.isArray(color) && { color }),
    ...(size && !Array.isArray(size) && { size }),
    ...(color &&
      Array.isArray(color) && {
        availableColors: {
          hasEvery: [color],
        },
      }),
    ...(age && {
      age: {
        hasEvery: Array.isArray(age) ? age : [age],
      },
    }),
    ...(sex && {
      sex: {
        hasEvery: Array.isArray(sex) ? sex : [sex],
      },
    }),
    ...(size &&
      Array.isArray(size) && {
        availableSizes: {
          hasEvery: [size],
        },
      }),
    ...(material && {
      material: {
        hasEvery: Array.isArray(material) ? material : [material],
      },
    }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: +minPrice }),
        ...(maxPrice && { lte: +maxPrice }),
      },
    }),
    ...(availableQuantity && { availableQuantity }),
  } as ProductFilters;

  const products = await prisma.product.findMany({
    where: filters,
  });
  return res.json(products);
};

export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    return ApiError.badRequest(`Product does not exist`);
  }

  return res.send(product);
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const body = req.body;

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    return ApiError.badRequest("Product with this id does not exist");
  }

  const updatedProduct = await prisma.product.update({
    where: {
      id,
    },
    data: body,
  });
  if (!updatedProduct) {
    return ApiError.badRequest("Wrong data");
  }
  return res.send(updatedProduct);
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    return ApiError.badRequest(
      "Can not delete product because it does not exist"
    );
  }

  return await prisma.product.delete({
    where: {
      id,
    },
  });
};
