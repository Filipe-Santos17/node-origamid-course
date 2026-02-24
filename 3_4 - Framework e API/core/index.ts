import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { customRequest, customResponse } from "./http/index.ts";
import Router from "./routes.ts";
import bodyJson from "./middleware/body-json.ts";
import { Database } from "./database.ts";

import RouteError from "./utils/route-error.ts";
import NotFoundError from "./utils/errors/not-found-error.ts";

export class Core {
    router: Router;
    private server: Server;
    db: Database;

    constructor() {
        this.router = new Router();
        this.router.use([bodyJson]);
        this.db = new Database("./lms.sqlite");
        this.server = createServer(this.handler);
    }

    handler = async (request: IncomingMessage, response: ServerResponse) => {
        try {
            const req = await customRequest(request);
            const res = await customResponse(response);

            //Middlewares global
            for (const middleware of this.router.middlewares) {
                await middleware(req, res);
            }

            //@ts-ignore
            const matched = this.router.findRouter(req.method, req.pathname);

            if (!matched) {
                throw new NotFoundError("Rota não encontrada");
            }

            const { route, params } = matched;

            req.params = params;

            //Middlewares locais
            for (const middleware of route.middlewares) {
                await middleware(req, res);
            }

            await route.handler(req, res);
        } catch (e) {
            response.setHeader("content-type", "application/problem+json");

            if (e instanceof RouteError) {
                const { message, status } = e;

                response.statusCode = status;

                response.end(JSON.stringify({ message }));
            } else {
                console.error(`Server Erro: ${e}`);

                response.statusCode = 500;

                response.end(JSON.stringify({ message: "Erro de servidor" }));
            }
        }
    };

    init(port: number, msg: string) {
        this.server.listen(port || 8000, () => console.log(msg));

        //eventos tratados automaticamente pelo nodejs e fornecidos pelo createServer
        this.server.on("clientError", (error, socket) => {
            console.log(`Client Error: ${error.message}`);
            socket.destroy(); //Encerra conexão
        });
    }
}
