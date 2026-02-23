import { Api } from "../../core/utils/abstract.ts";
import NotAuthorizedError from "../../core/utils/errors/not-authorized-error.ts";
import NotFoundError from "../../core/utils/errors/not-found-error.ts";
import RouteError from "../../core/utils/route-error.ts";
import { AuthMiddleware } from "./middlewares/auth.ts";
import { AuthQuery } from "./querys.ts";
import { PasswordService } from "./services/password.ts";
import { SessionService } from "./services/session.ts";
import { authTables } from "./tables.ts";

export class AuthApi extends Api {
    query = new AuthQuery(this.db);
    session = new SessionService(this.core);
    authMiddlweare = new AuthMiddleware(this.core);
    password = new PasswordService("pepper");

    handlers = {
        login: async (req, res) => {
            const { email, password } = req.body;

            const userDb = this.query.getUser(email);

            if (!userDb) {
                throw new RouteError(404, "Email ou senha incorretos");
            }

            const isPasswordCorrect = await this.password.verifyPassword(password, userDb.password_hash);

            if (!isPasswordCorrect) {
                throw new RouteError(404, "Email ou senha incorretos");
            }

            const { cookie } = await this.session.create_session({
                userId: userDb.id,
                ip: req.ip,
                ua: req.ua,
            });

            res.setCookie(cookie);

            res.status(200).json({
                message: "login ok",
            });
        },

        logout: (req, res) => {
            const sid = req.cookies["__Secure-sid"];

            const { cookie } = this.session.invalidate(sid);

            res.setCookie(cookie);

            res.setHeader("Cache-Control", "private, no-store");
            res.setHeader("Vary", "Cookie");

            res.status(204).json({ msg: "Logout" });
        },

        register: async (req, res) => {
            const { name, username, email, password } = req.params;

            const emailAlreadyExist = this.query.selectUser("email", email);

            if (!emailAlreadyExist) {
                throw new RouteError(409, "Erro ao criar usuário");
            }

            const usernameAlreadyExist = this.query.selectUser("username", username);

            if (!usernameAlreadyExist) {
                throw new RouteError(409, "Erro ao criar usuário");
            }

            const password_hash = (await this.password.encryptPassword(password)) as string;

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
            const session = req.session;

            if (!session) {
                throw new NotAuthorizedError();
            }

            res.status(200).json(session);
        },

        passwordUpdate: async (req, res) => {
            const { password, new_password } = req.body;

            if (!req.session) {
                throw new NotAuthorizedError();
            }

            const user_id = req.session?.user_id;
            const user = this.query.selectUser("id", user_id);

            if (!user) {
                throw new NotFoundError("Usuário não encontrado");
            }

            const isValidPassword = this.password.verifyPassword(password, user.password_hash);

            if (!isValidPassword) {
                throw new NotAuthorizedError();
            }

            const new_hash_password = (await this.password.encryptPassword(new_password)) as string;

            const upResult = this.query.updateUser(user_id, "password_hash", new_hash_password);

            if (!upResult.changes) {
                throw new NotFoundError("Usuário não encontrado");
            }

            this.query.revokeAllSessionByUserId(user_id);

            const { cookie } = await this.session.create_session({
                userId: user_id,
                ip: req.ip,
                ua: req.ua,
            });

            res.setCookie(cookie);

            res.status(200).json({ msg: "Senha atualizada" });
        },

        passwordForgot: async (req, res) => {
            const { email } = req.body;

            const user = this.query.selectUser("email", email);

            if (!user) {
                //setTimeout(() => {},3000)
                return res.status(200).json({ title: "verifique seu email" });
            }

            const { token } = await this.session.reset_token({
                userId: user.id,
                ip: req.ip,
                ua: req.ua,
            });

            const resetLink = `${req.baseUrl}/password/reset/?token=${token}`;

            const mailContent = {
                to: user.email,
                subject: "Password Reset",
                body: `Utilize o link abaixo para resetar sua senha: \r\n ${resetLink}`,
            };

            res.status(200).json({ title: "verifique seu email" });
        },
        passwordReset: async (req, res) => {
            const { new_password, token } = req.body;

            const reset = await this.session.validate_token(token);

            if (!reset) {
                throw new RouteError(400, "token inválido");
            }

            const new_password_hash = (await this.password.encryptPassword(new_password)) as string;

            const updateResult = this.query.updateUser(reset.user_id, "password_hash", new_password_hash);

            if (!updateResult.changes) {
                throw new RouteError(400, "Erro ao atualizar senha inválido");
            }

            res.status(200).json({ msg: "Senha atualizada" });
        },
    } satisfies Api["handlers"];

    tables(): void {
        this.db.exec(authTables);
    }

    routes(): void {
        this.router.post("/auth/login", this.handlers.login);
        this.router.post("/auth/logout", this.handlers.logout);
        this.router.post("/auth/register", this.handlers.register);
        this.router.post("/auth/session", this.handlers.getSession, [this.authMiddlweare.guard("user")]);
        this.router.put("/auth/update-password", this.handlers.passwordUpdate, [this.authMiddlweare.guard("user")]);
        this.router.post("/auth/forgot-password", this.handlers.passwordForgot);
        this.router.post("/auth/reset-password", this.handlers.passwordReset);
    }
}
