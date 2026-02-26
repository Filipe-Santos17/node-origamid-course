import RouteError from "../route-error.ts";

export default class BadRequestError extends RouteError {
    constructor(message: string = "Informações incorretas") {
        super(400, message);
    }
}
