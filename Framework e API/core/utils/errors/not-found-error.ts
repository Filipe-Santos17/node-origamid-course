import RouteError from "../route-error.ts";

export default class NotFoundError extends RouteError {
    constructor(message: string = "Dado não encontrado") {
        super(404, message);
    }
}
