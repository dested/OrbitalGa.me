export class RequestError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
  }
}
export class ValidationError extends RequestError {
  constructor() {
    super(400, 'This request is invalid.');
  }
}
export class ServerError extends RequestError {
  constructor() {
    super(500, 'An unexpected error has occurred.');
  }
}
export class UnauthorizedError extends RequestError {
  constructor() {
    super(401, 'This request is unauthorized.');
  }
}
export class NotFoundError extends RequestError {
  constructor() {
    super(404, 'This resource could not be found.');
  }
}
