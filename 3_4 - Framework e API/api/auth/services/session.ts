import { CoreProvider } from "../../../core/utils/abstract.ts";
import { AuthQuery } from "../querys.ts";
import { hashCode256, randomBytesAsync } from "../utils.ts";

interface iCreateSession {
    userId: number;
    ip: string;
    ua: string;
}

const ttlSec = 60 * 60 * 24 * 15;
const ttlSecFiveDays = 60 * 60 * 24 * 5;

function sidCookie(sid: string, expires: number) {
    //__Secure-sid = Prefixo '__Secure' impõe as configurações de segurança
    //Path = caminhos da rota que o cookie pode ser acessado, se colocar '/' funciona em todos os caminhos do site
    //Max-Age = Total em segundos que o cookie é armazenado, depois apaga
    //HttpOnly = Impede que js e extensões tenham acesso
    //Secure = Apena comunica em https, no localhost o browser permite sem https
    //SameSite = Lax (Afirma que o cookie apenas pode ser usado pela mesma rota da api)
    //Ps: Para deletar o cookie é só enviar o valor do sid vazio ou o Max-age como 0
    return `
            __Secure-sid=${sid}; 
            Path=/;
            Max-age=${expires};
            HttpOnly;
            Secure;
            SameSite=Lax;
        `
        .trim()
        .replaceAll("\t", "");
}

export class SessionService extends CoreProvider {
    query = new AuthQuery(this.db);

    async create_session({ userId, ua, ip }: iCreateSession) {
        const sid = (await randomBytesAsync(32)).toString("base64url");
        const sid_hash = hashCode256(sid);

        const fifteen_days = ttlSec * 1000;
        const expires_ms = Date.now() + fifteen_days;

        this.query.insertSession({ user_id: userId, ip, ua, sid_hash, expires_ms });

        const cookie = sidCookie(sid, ttlSec);

        return { cookie };
    }

    validate(sid: string) {
        const now = Date.now();
        const sid_hash = hashCode256(sid);

        //Busca o sid_hash, se não existir então deleta o cookie
        const session = this.query.selectSession(sid_hash);

        if (!session || session.revoked) {
            return {
                valid: false,
                cookie: sidCookie("", 0),
            };
        }

        let exp_ms = session.expires_ms;

        //Altera o revoke para positivo no banco se o tempo do cookie tiver expirado
        if (now > exp_ms) {
            this.query.revokeSession("sid_hash", sid_hash);
        }

        //Atualiza o cookie automaticamente se faltar menos de 5 dias para expirar
        if (now >= exp_ms - 1000 * ttlSecFiveDays) {
            const expires_msUpdate = now + 1000 * ttlSec;

            this.query.updateSessionExpires(sid_hash, expires_msUpdate);

            exp_ms = expires_msUpdate;
        }

        //Revoga o cookie e deleta do browser caso o usuário não exista
        const user = this.query.selectUserRole(session.user_id);

        if (!user) {
            this.query.revokeSession("sid_hash", sid_hash);

            return {
                valid: false,
                cookie: sidCookie("", 0),
            };
        }

        const time_cookie = Math.floor((exp_ms - now) / 1000);

        return {
            valid: true,
            cookie: sidCookie(sid, time_cookie),
            session: {
                user_id: session.user_id,
                role: user.role,
                expires_ms: exp_ms,
            },
        };
    }

    invalidate(sid: string | undefined) {
        const cookie = sidCookie("", 0);

        try {
            if (sid) {
                const sid_hash = hashCode256(sid);
                this.query.revokeSession("sid_hash", sid_hash);
            }
        } catch (_) {
            console.error("Sessão não invalidada no banco");
        }

        return { cookie };
    }
}
