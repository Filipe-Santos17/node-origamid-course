import { Api } from "../../core/utils/abstract.ts";
import NotAuthorizedError from "../../core/utils/errors/not-authorized-error.ts";
import RouteError from "../../core/utils/route-error.ts";
import { AuthQuery } from "./querys.ts";
import { SessionService } from "./services/session.ts";
import { authTables } from "./tables.ts";

export class AuthApi extends Api {
    query = new AuthQuery(this.db);
    session = new SessionService(this.core);

    handlers = {
        login: async (req, res) => {
            const { email, password } = req.body;

            const userDb = this.query.getUser(email);

            if (!userDb) {
                throw new RouteError(404, "Email ou senha incorretos");
            }

            const { cookie } = await this.session.create_session({
                userId: userDb.id,
                ip: req.ip,
                ua: req.headers["user-agent"] ?? "",
            });

            res.setCookie(cookie);

            res.status(200).json({
                message: "login ok",
            });
        },

        register: (req, res) => {
            const { name, username, email, password } = req.params;

            const password_hash = password;

            const writeResult = this.query.insertUser({
                name,
                username,
                email,
                role: "user",
                password_hash,
            });

            if (writeResult.changes === 0) {
                throw new RouteError(400, "Erro ao criar usuário");
            }

            res.status(201).json({
                message: "Usuário criado com sucesso",
            });
        },

        getSession: (req, res) => {
            const sid = req.cookies["__Secure-sid"];

            if (!sid) {
                throw new NotAuthorizedError("Não autorizado");
            }

            const { cookie, valid, session } = this.session.validate(sid);

            res.setCookie(cookie);

            if (!valid || !session) {
                throw new NotAuthorizedError("Não autorizado");
            }

            res.setHeader("Cache-Control", "private, no-store");
            res.setHeader("Vary", "Cookie");

            res.status(200).json({ msg: "Autorizado" });
        },
    } satisfies Api["handlers"];

    tables(): void {
        this.db.exec(authTables);
    }

    routes(): void {
        this.router.post("/auth/login", this.handlers.login);
        this.router.post("/auth/register", this.handlers.register);
        this.router.post("/auth/session", this.handlers.getSession);
    }
}
