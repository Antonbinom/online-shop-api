import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt"; //для хэширования паролей пользователей хранящихся в БД
import jwt from "jsonwebtoken"; //для создания jwt токена
import { NextFunction, Request, Response } from "express";
import prisma from "../client";
import { Role, Sex } from "@prisma/client";
import ApiError from "../helpers/ApiError";

interface RequestBody {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: Role | null;
  avatar: string;
  birthday: string;
  sex: string;
  country: string;
  city: string;
  showAge: string;
  orders: string;
  cart: string;
}

interface Payload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  city?: string;
  birthday?: string;
  sex?: string;
  country?: string;
}

const generateJwt = ({
  id,
  email,
  firstName,
  lastName,
  phone,
}: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}) => {
  const secretKey = process.env.SECRET_KEY;

  if (!secretKey) {
    throw ApiError.internal(
      "SECRET_KEY is not defined in the environment variables."
    );
  }

  return jwt.sign({ id, firstName, lastName, phone, email }, secretKey, {
    expiresIn: "24h",
  });
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName, phone, email, password } =
      req.body as RequestBody;

    if (!email || !password) {
      return next(ApiError.badRequest("Incorrect email or password"));
    }
    const isUserExists = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (isUserExists) {
      return next(
        ApiError.badRequest(`User with email: ${email} already exists`)
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        password: hashedPassword,
        avatar: "",
        birthday: "",
        sex: Sex.UNKNOWN,
        country: "",
        city: "",
        showAge: false,
        role: Role.BUYER,
      },
    });

    const cart = await prisma.cart.create({
      data: {
        userId: user.id,
      },
    });

    const token = generateJwt({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
    });

    res.json({ token });
  } catch (error: any) {
    next(ApiError.badRequest(error.message));
  }
};

export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return next(ApiError.badRequest(`User with email:${email} not found`));
    }
    const comparePassword = bcrypt.compareSync(password, user.password);

    if (!comparePassword) {
      return next(ApiError.badRequest("Wrong password!"));
    }

    const token = generateJwt({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
    });
    return res.json({ token });
  } catch (error: any) {
    next(ApiError.badRequest(error.message));
  }
};

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  const bearerToken = req.headers["authorization"] as string;
  const token = bearerToken.split(" ")[1];
  const payload = jwt.decode(token) as Payload;

  if (!payload.email) {
    return next(ApiError.badRequest("Unauthorized request"));
  }

  const filter = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    ...(payload.avatar && { avatar: true }),
    ...(payload.birthday && { birthday: true }),
    ...(payload.sex && { sex: true }),
    ...(payload.country && { country: true }),
    ...(payload.city && { city: true }),
    showAge: true,
  };

  // const user = await prisma.user.findUnique({
  //   where: {
  //     email: payload.email,
  //   },
  //   select: filter,
  // });

  // if (!user) {
  //   return next(ApiError.badRequest("User not found"));
  // }

  return res.send(payload);
};

// {
//   "firstName": "Anton",
//   "lastName": "Semenikhin",
//   "phone": "89995398262",
//   "email": "anton@mail.ru",
//   "password": "12345678",
//   "avatar": "",
//   "birthday": "",
//   "sex": "",
//   "country": "",
//   "city": "",
//   "showAge": "",
//   "role": ""
// }

// {
//   "firstName": "anton",
//   "lastName": "semenikhin",
//   "phone": "89995398262",
//   "email": "anton@mail.ru",
//   "password": "12345678"
// }
