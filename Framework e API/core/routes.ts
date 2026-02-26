import type { iRouter, tHandler, tMiddleware } from "./types/index.d.ts";

export default class Router {
    routes: iRouter = {
        GET: {},
        POST: {},
        PUT: {},
        DELETE: {},
        HEAD: {},
    };
    middlewares: tMiddleware[] = [];

    get(path: string, handler: tHandler, middlewares: tMiddleware[] = []) {
        this.routes["GET"][path] = { handler, middlewares };
    }

    post(path: string, handler: tHandler, middlewares: tMiddleware[] = []) {
        this.routes["POST"][path] = { handler, middlewares };
    }

    put(path: string, handler: tHandler, middlewares: tMiddleware[] = []) {
        this.routes["PUT"][path] = { handler, middlewares };
    }

    delete(path: string, handler: tHandler, middlewares: tMiddleware[] = []) {
        this.routes["DELETE"][path] = { handler, middlewares };
    }

    head(path: string, handler: tHandler, middlewares: tMiddleware[] = []) {
        this.routes["HEAD"][path] = { handler, middlewares };
    }

    use(middlewares: tMiddleware[]) {
        this.middlewares.push(...middlewares);
    }

    findRouter(method: keyof iRouter, path: string) {
        const routesByMethod = this.routes[method];

        if (!routesByMethod) return null;

        const matchedRouter = routesByMethod[path];

        if (matchedRouter) {
            return {
                route: matchedRouter,
                params: {},
            };
        }

        const reqChuncks = path.split("/").filter(Boolean);

        for (const route of Object.keys(routesByMethod)) {
            if (!route.includes(":")) continue;

            const routesChuncks = route.split("/").filter(Boolean);

            if (reqChuncks.length !== routesChuncks.length) continue;
            if (reqChuncks[0] !== routesChuncks[0]) continue;

            const params: Record<string, string> = {};
            let ok = true;

            for (let i = 0; i < reqChuncks.length; i++) {
                const segment = routesChuncks[i];
                const value = reqChuncks[i];

                if (segment.startsWith(":")) {
                    params[segment.slice(1)] = value;
                } else if (segment !== value) {
                    ok = false;
                    break;
                }
            }

            if (ok) {
                return {
                    route: routesByMethod[route],
                    params,
                };
            }
        }

        return null;
    }
}
