import { Query } from "../../core/utils/abstract.ts";

export type tUserRole = "admin" | "editor" | "user";

interface iUserData {
    id: number;
    name: string;
    username: string;
    email: string;
    role: tUserRole;
    password_hash: string;
    created: string;
    updated: string;
}

type tUserCreate = Omit<iUserData, "id" | "created" | "updated">;

interface iUserSession {
    sid_hash: Buffer;
    user_id: number;
    created: number;
    expires: number;
    ip: string;
    ua: string;
    revoked: number; //0 | 1
}

type tUserSessionInsert = Omit<iUserSession, "created" | "expires" | "revoked"> & {
    expires_ms: number;
};

type tResetPassInsert = Omit<iUserSession, "created" | "expires" | "revoked" | "sid_hash"> & {
    expires_ms: number;
    token: Buffer;
};

export class AuthQuery extends Query {
    insertUser({ name, username, email, role, password_hash }: tUserCreate) {
        return this.db
            .query(
                /*sql*/ `
            INSERT OR IGNORE INTO "users"
            ("name", "username", "email", "role", "password_hash")
            VALUES (?,?,?,?,?)`,
            )
            .run(name, username, email, role, password_hash);
    }

    selectUser(key: "email" | "username" | "id", value: string | number) {
        return this.db
            .query(
                /*sql*/ `
            SELECT "id", "password_hash", "email"
            FROM "users" WHERE ${key} = ?`,
            )
            .get(value) as { id: number; password_hash: string; email: string } | undefined;
    }

    getUser(email: string) {
        return this.db.query(/*sql*/ `SELECT * FROM "users" WHERE "email" = ?`).get(email) as iUserData | undefined;
    }

    insertSession({ sid_hash, user_id, expires_ms, ip, ua }: tUserSessionInsert) {
        const expires = Math.floor(expires_ms / 1000);

        return this.db
            .query(
                /*sql*/ `
            INSERT OR IGNORE INTO "sessions"
            ("sid_hash", "user_id", "expires", "ip", "ua")
            VALUES (?,?,?,?,?)`,
            )
            .run(sid_hash, user_id, expires, ip, ua);
    }

    selectSession(sid_hash: Buffer) {
        return this.db
            .query(
                /*sql*/ `
            SELECT "s".*, "s"."expires" * 1000 as "expires_ms" 
            FROM "sessions" as "s" 
            WHERE "sid_hash" = ?`,
            )
            .get(sid_hash) as (iUserSession & { expires_ms: number }) | undefined;
    }

    revokeSession(sid_hash: Buffer) {
        return this.db.query(/*sql*/ `UPDATE "sessions" SET "revoked" = 1 WHERE "sid_hash" = ?`).run(sid_hash);
    }

    revokeAllSessionByUserId(user_id: number) {
        return this.db.query(/*sql*/ `UPDATE "sessions" SET "revoked" = 1 WHERE "user_id" = ?`).run(user_id);
    }

    updateSessionExpires(sid_hash: Buffer, exp_ms_up: number) {
        const exp_ms = Math.floor(exp_ms_up / 1000);

        return this.db.query(/*sql*/ `UPDATE "sessions" SET "expires" = ? WHERE "sid_hash" = ?`).run(exp_ms, sid_hash);
    }

    insertReset({ token, user_id, expires_ms, ip, ua }: tResetPassInsert) {
        const expires = Math.floor(expires_ms / 1000);

        return this.db
            .query(
                /*sql*/ `
            INSERT OR IGNORE INTO "resets"
            ("token_hash", "user_id", "expires", "ip", "ua")
            VALUES (?,?,?,?,?)`,
            )
            .run(token, user_id, expires, ip, ua);
    }

    selectTokenReset(token_hash: Buffer) {
        return this.db
            .query(
                /*sql*/ `
            SELECT "r".*, "r"."expires" * 1000 as "expires_ms" 
            FROM "resets" as "r" 
            WHERE "token_hash" = ?`,
            )
            .get(token_hash) as tResetPassInsert | undefined;
    }

    deleteReset(user_id: number) {
        return this.db
            .query(
                /*sql*/ `
                DELETE FROM "resets"
                WHERE "user_id" = ?`,
            )
            .run(user_id);
    }

    selectUserRole(user_id: number) {
        return this.db
            .query(
                /*sql*/ `
            SELECT "role" FROM "users" WHERE "id" = ?`,
            )
            .get(user_id) as { role: iUserData["role"] } | undefined;
    }

    updateUser(user_id: number, key: "password_hash" | "email" | "name", value: string) {
        return this.db.query(/*sql*/ `UPDATE "users" SET ${key} = ? WHERE "id" = ?`).run(value, user_id);
    }
}
