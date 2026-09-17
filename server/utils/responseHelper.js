/**
 * Response helper — consistent API response shape
 */

const success = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const created = (res, data = {}, message = 'Created') =>
  success(res, data, message, 201);

const noContent = (res) => res.status(204).send();

const fail = (res, message = 'Bad request', statusCode = 400, errors = null) =>
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });

const unauthorized = (res, message = 'Unauthorized') => fail(res, message, 401);

const forbidden = (res, message = 'Forbidden') => fail(res, message, 403);

const notFound = (res, message = 'Not found') => fail(res, message, 404);

const serverError = (res, message = 'Internal server error') =>
  fail(res, message, 500);

module.exports = { success, created, noContent, fail, unauthorized, forbidden, notFound, serverError };
