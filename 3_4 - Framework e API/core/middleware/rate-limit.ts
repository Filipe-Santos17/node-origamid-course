/*Rate Limit - Limitar a quantidade de requests que o usuário pode fazer por segundo é uma boa prática para mitigar ataques como DDoS.
--Essencial em rotas sensiveis como login (evita descobrir senha por força bruta) e rotas que implicam em queries ou processos de grande impacto na mémoria
--WAF (Web Application Firewall): O Rate Limit na aplicação é apenas uma medida extra de segurança, o ideal é ter configurado o Rate Limit diretamente no seu WAF (como Cloudflare e outros).
*/
import type { tMiddleware } from "../types";
import RouteError from "../utils/route-error";

type tMapLimit = {
    hits: number;
    expire: number;
};

export const rateLimit = (time: number = 2000, max_req: number = 5): tMiddleware => {
    const requests = new Map<string, tMapLimit>();

    setInterval(
        () => {
            //Limpa a cada 30 min o map
            const now = Date.now();

            for (const [key, item] of requests) {
                if (now >= item.expire) {
                    requests.delete(key);
                }
            }
            requests.clear();
        },
        30 * 60 * 1000,
    ).unref(); //Unref dita que o setInterval possa ser interrompido se o node entrar em modo de repouso

    return async (req, res) => {
        const now = Date.now();
        const key = req.ip;
        let mapLimit = requests.get(key);

        if (!mapLimit || now >= mapLimit.expire) {
            mapLimit = {
                hits: 0,
                expire: now + time,
            };

            requests.set(key, mapLimit);
        }

        mapLimit.hits += 1;

        // https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/
        const sLeft = Math.ceil((mapLimit.expire - now) / 1000);
        const rLeft = Math.max(0, max_req - mapLimit.hits);
        const sTime = Math.ceil(time / 1000);
        res.setHeader("RateLimit", `"default";r=${rLeft};t=${sLeft}`);
        res.setHeader("RateLimit-Policy", `"default";q=${max_req};w=${sTime}`);

        if (mapLimit.hits > max_req) {
            res.setHeader("Retry-After", `${sLeft}`);
            throw new RouteError(429, "rate-limit");
        }
    };
};
