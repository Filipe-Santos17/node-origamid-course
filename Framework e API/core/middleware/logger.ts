import type { tMiddleware } from '../types/index.d.ts';

export const logger: tMiddleware = (req, res) => {
    console.log(`${Date.now()} ${req.method} ${req.pathname}`);
};
