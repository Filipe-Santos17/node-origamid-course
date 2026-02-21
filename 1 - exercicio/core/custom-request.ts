import type { IncomingMessage } from "node:http";
import type { iCustomReq } from "../types/index.d.ts";

export default async function customRequest(request: IncomingMessage) {
    const req = request as iCustomReq;

    const url = new URL(req.url || "", "http://localhost.com");

    req.query = url.searchParams;
    req.pathname = url.pathname;
    req.method = req.method || "GET";

    const bodyChuncks: Buffer[] = [];

    for await (const data of req) {
        bodyChuncks.push(data);
    }

    const body = Buffer.concat(bodyChuncks).toString("utf-8");

    const allowedMethodsToHaveBody = ["POST", "PUT", "PATCH"];

    if (
        allowedMethodsToHaveBody.includes(req.method || "") ||
        req["headers"]["content-type"] === "application/json"
    ) {
        req.body = JSON.parse(body);
    } else {
        req.body = {};
    }

    return req;
}
