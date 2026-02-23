import RouteError from "../route-error.ts";

export default class NotAuthorizedError extends RouteError {
    constructor(message: string = "Não autorizado") {
        super(401, message);
    }
}
