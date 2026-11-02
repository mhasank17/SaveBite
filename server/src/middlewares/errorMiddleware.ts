import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Unhandled Error]', err.stack || err.message);

  // Handle express.json() body-parser malformed JSON errors
  if (err instanceof SyntaxError && ((err as any).status === 400 || (err as any).statusCode === 400)) {
    res.status(400).json({
      success: false,
      message: 'Malformed or invalid JSON payload received.',
    });
    return;
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};
