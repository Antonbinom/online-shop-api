import ApiError from "./ApiError";
import jwt from "jsonwebtoken";

interface Payload {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  showAge: boolean;
}

export const jwtTokenPayload = async (bearerToken: string | undefined) => {
  if (!bearerToken) {
    return ApiError.badRequest("The Berarer token is required");
  }

  const token = bearerToken.split(" ")[1];
  const payload = jwt.decode(token) as Payload;

  return payload;
};
