interface iRouter {
    GET: Record<string, Function>;
    POST: Record<string, Function>;
    PUT: Record<string, Function>;
    DELETE: Record<string, Function>;
}

export class Router {
    private router: iRouter = {
        GET: {},
        POST: {},
        PUT: {},
        DELETE: {},
    };

    get(path: string, handler: Function) {
        if (path in this.router["GET"]) return;
        this.router["GET"][path] = handler;
    }

    post(path: string, handler: Function) {
        if (path in this.router["POST"]) return;
        this.router["POST"][path] = handler;
    }

    findRouter(method: keyof iRouter, path: string) {
        return this.router[method]?.[path] || null;
    }
}
