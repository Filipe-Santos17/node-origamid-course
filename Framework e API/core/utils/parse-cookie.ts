//Cookies vem apenas como chave=valor, todas as configurações são removidas pelo node
export function parseCookie(cookieHeader: string | undefined) {
    const cookies: Record<string, string | undefined> = {};
    if (!cookieHeader) return cookies;

    const cookiePairs = cookieHeader.split(";");

    //TODO: fazer com que cookies de nomes iguais tenham como valor um array com ambos valores
    for (const seg of cookiePairs) {
        const pair = seg.trim();

        if (!pair) continue;

        const i = pair.indexOf("="); //primeiro =, pois pode conter também no valor
        const key = i === -1 ? pair : pair.slice(0, i).trim();

        if (!key) continue;

        const value = i === -1 ? "" : pair.slice(i + 1).trim();
        cookies[key] = value;
    }

    return cookies;
}
