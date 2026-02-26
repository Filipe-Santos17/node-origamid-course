import RouteError from "../route-error.ts";

export default class InternalServerError extends RouteError {
    constructor(message: string) {
        super(500, message);
    }
}
