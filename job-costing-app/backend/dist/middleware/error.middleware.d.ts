import { Request, Response, NextFunction } from 'express';
export interface ErrorResponse {
    error: string;
    message: string;
    requestId?: string;
    details?: unknown;
}
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    requestId?: string;
    constructor(message: string, statusCode: number, requestId?: string);
}
export declare const errorHandler: (err: Error, req: Request, res: Response, _next: NextFunction) => void;
export declare const asyncHandler: <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.middleware.d.ts.map