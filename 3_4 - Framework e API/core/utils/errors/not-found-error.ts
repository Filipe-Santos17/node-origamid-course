import RouteError from "../route-error.ts";

export default class NotFoundError extends RouteError {
    constructor(message: string) {
        super(404, message);
    }
}
