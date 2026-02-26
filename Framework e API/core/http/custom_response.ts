import type { ServerResponse } from "node:http";
import type { iCustomResponse } from "../types";

export default async function customResponse(response: ServerResponse) {
    const res = response as iCustomResponse;

    res.json = (data) => {
        if (data) {
            try {
                const body = JSON.stringify(data);

                res.setHeader("Content-Type", "application/json");

                res.end(body);
            } catch (e) {
                const msgError = JSON.stringify({ msg: "Error parse data" });

                res.status(500).end(msgError);
            }
        }
    };

    res.status = (status) => {
        res.statusCode = status;

        return res;
    };

    res.setCookie = (cookie) => {
        const current = res.getHeader("Set-Cookie");

        // nada setado ainda -> começa a lista
        if (current === undefined) {
            res.setHeader("Set-Cookie", [cookie]);
            return;
        }

        // já é uma lista -> faz o push
        if (Array.isArray(current)) {
            current.push(cookie);
            res.setHeader("Set-Cookie", current);
            return;
        }

        // havia um único valor -> vira lista com os dois
        res.setHeader("Set-Cookie", [String(current), cookie]);
    };

    return res;
}
