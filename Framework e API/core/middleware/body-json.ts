import type { tMiddleware } from "../types";
import BadRequestError from "../utils/errors/bad-request";
import RouteError from "../utils/route-error";

const MAX_LENGTH_BODY_DATA_BYTES = 5_000_000;

const bodyJson: tMiddleware = async (req, res) => {
    if (
        req.headers["content-type"] !== "application/json" &&
        req.headers["content-type"] !== "application/json; charset=utf-8"
    ) {
        return;
    }

    const contentLength = Number(req.headers["content-length"]);

    if (!Number.isInteger(contentLength)) {
        throw new RouteError(413, "Requisição com corpo muito grande");
    }

    if (contentLength > MAX_LENGTH_BODY_DATA_BYTES) {
        throw new RouteError(413, "Requisição com corpo muito grande");
    }

    const chunks: Buffer[] = [];
    let size = 0;

    try {
        for await (const chunk of req) {
            const buff = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            size += buff.length;

            if (size > MAX_LENGTH_BODY_DATA_BYTES) {
                throw new RouteError(413, "Requisição com corpo muito grande");
            }

            chunks.push(buff);
        }
    } catch (e) {
        throw new BadRequestError("Requisição abortada");
    }

    const body = Buffer.concat(chunks).toString("utf-8");

    if (!body) {
        req.body = {};
        return;
    }

    req.body = JSON.parse(body);
};

export default bodyJson;
