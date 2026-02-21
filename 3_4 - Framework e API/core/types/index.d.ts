import type { IncomingMessage, ServerResponse } from "node:http";

export interface iCustomRequest extends IncomingMessage {
    query: URLSearchParams;
    pathname: string;
    method: string;
    body: Record<string, any>;
    params: Record<string, any>;
    ip: string;
    cookies: Record<string, string | undefined>;
}

export interface iCustomResponse extends ServerResponse {
    status: (code: number) => iCustomResponse;
    json: (data: Record<string, any>) => void;
    setCookie: (cookie: string) => void;
}

export type tHandler = (req: iCustomRequest, res: iCustomResponse) => Promise<void> | void;

export type tMiddleware = tHandler;

export type tHttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD";

export interface iRouter {
    [method: string]: {
        [path: string]: {
            handler: tHandler;
            middlewares: tMiddleware[];
        };
    };
}

// GET: Record<string, Record<string, tHandler>>;
// POST: Record<string, Record<string, tHandler>>;
// PUT: Record<string, Record<string, tHandler>>;
// DELETE: Record<string, Record<string, tHandler>>;
// HEAD: Record<string, Record<string, tHandler>>;
