import type { tMiddleware } from "../../../core/types/index.d.ts";
import { CoreProvider } from "../../../core/utils/abstract.ts";
import NotAuthorizedError from "../../../core/utils/errors/not-authorized-error.ts";
import RouteError from "../../../core/utils/route-error.ts";
import type { tUserRole } from "../querys.ts";
import { SessionService } from "../services/session.ts";

function roleCheck(requiredRole: tUserRole, userRole: tUserRole): boolean {
    switch (userRole) {
        case "admin":
            return true;
        case "editor":
            return requiredRole === "editor" || requiredRole === "user";
        case "user":
            return requiredRole === "user";
        default:
            return false;
    }
}

export class AuthMiddleware extends CoreProvider {
    session = new SessionService(this.core);

    guard =
        (role: tUserRole): tMiddleware =>
        async (req, res) => {
            res.setHeader("Cache-Control", "private, no-store");
            res.setHeader("Vary", "Cookie");

            const sid = req.cookies["__Secure-sid"];

            if (!sid) {
                throw new NotAuthorizedError();
            }

            const { cookie, valid, session } = this.session.validate(sid);

            res.setCookie(cookie);

            if (!valid || !session) {
                throw new NotAuthorizedError();
            }

            if (!roleCheck(role, session.role)) {
                throw new RouteError(403, "Sem permissão");
            }

            req.session = session;
        };

    optional: tMiddleware = async (req, res) => {
        const sid = req.cookies["__Secure-sid"];

        if (!sid) {
            return;
        }

        const { cookie, valid, session } = this.session.validate(sid);

        res.setCookie(cookie);

        if (!valid || !session) {
            return;
        }

        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("Vary", "Cookie");

        req.session = session;
    };
}
