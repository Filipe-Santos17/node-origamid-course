import type { IncomingMessage } from "node:http";
import type { iCustomRequest } from "../types/index.d.ts";
import { parseCookie } from "../utils/parse-cookie.ts";

export default async function customRequest(request: IncomingMessage) {
    const req = request as iCustomRequest;

    const url = new URL(req.url || "", "http://localhost"); //TODO: trocar por env?

    req.query = url.searchParams;
    req.pathname = url.pathname;

    req.method = req.method || "GET";

    req.ip = req.socket.remoteAddress || "127.0.0.1";

    req.cookies = parseCookie(req.headers.cookie);

    req.body = {};

    return req;
}
