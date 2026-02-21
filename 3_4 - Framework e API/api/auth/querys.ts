import { Query } from "../../core/utils/abstract";

interface iUserData {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
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

    revokeSession(key: "sid_hash" | "user_id", sid_hash: Buffer) {
        return this.db.query(/*sql*/ `UPDATE "sessions" SET "revoked" = 1 WHERE ${key} = ?`).run(sid_hash);
    }

    updateSessionExpires(sid_hash: Buffer, exp_ms_up: number) {
        const exp_ms = Math.floor(exp_ms_up / 1000);

        return this.db.query(/*sql*/ `UPDATE "sessions" SET "expires" = ? WHERE "sid_hash" = ?`).run(exp_ms, sid_hash);
    }

    selectUserRole(user_id: number) {
        return this.db
            .query(
                /*sql*/ `
            SELECT "role" FROM "users" WHERE "id" = ?`,
            )
            .get(user_id) as { role: iUserData["role"] } | undefined;
    }
}
