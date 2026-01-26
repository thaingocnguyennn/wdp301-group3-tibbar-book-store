class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
  }

  static success(res, statusCode, message, data = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data));
  }

  static error(res, statusCode, message, errors = null) {
    const response = new ApiResponse(statusCode, message);
    if (errors) {
      response.errors = errors;
    }
    return res.status(statusCode).json(response);
  }
}

export default ApiResponse;