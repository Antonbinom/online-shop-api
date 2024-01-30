class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super();
    this.status = status;
    this.message = message;
  }

  static badRequest(message: string) {
    throw new ApiError(404, message);
  }

  static forbidden(message: string) {
    throw new ApiError(403, message);
  }

  static internal(message: string) {
    throw new ApiError(500, message);
  }
}

export default ApiError;
