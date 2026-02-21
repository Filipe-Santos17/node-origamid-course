import type { ServerResponse } from "node:http";
import type { iCustomRes } from "../types/index.d.ts";

export default async function customResponse(response: ServerResponse) {
    const res = response as iCustomRes;

    res.json = (data) => {
        try {
            if (data) {
                const body = JSON.stringify(data);

                res.setHeader("content-type", "application/json");

                res.end(body);
            }
        } catch (e) {
            console.error(`Error send Data: ${e}`);

            res.end();
        }
    };

    res.status = (sts) => {
        res.statusCode = sts;

        return res;
    };

    return res;
}
