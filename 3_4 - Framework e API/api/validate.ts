import RouteError from "../core/utils/route-error";

function string(x: unknown) {
    if (typeof x !== "string") return undefined;

    const s = x.trim();

    if (s.length === 0) return undefined;

    return s;
}

function number(x: unknown) {
    if (typeof x === "number") {
        return Number.isFinite(x) ? x : undefined;
    }

    if (typeof x === "string" && x.trim().length !== 0) {
        const n = Number(x);

        return Number.isFinite(n) ? n : undefined;
    }

    return undefined;
}

function boolean(x: unknown) {
    if (x) {
        return true;
    }

    return false;
}

function object(x: unknown): Record<string, unknown> | undefined {
    return typeof x === "object" && x !== null && !Array.isArray(x) ? (x as Record<string, unknown>) : undefined;
}

const email_re = /^[^@]+@[^@]+\.[^@]+$/;

function email(x: unknown) {
    const s = String(x)?.toLowerCase();

    if (s === undefined) return undefined;

    return email_re.test(s) ? s : undefined;
}

const password_re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

function password(x: unknown) {
    if (typeof x !== "string") return undefined;

    if (x.length < 10 || x.length > 256) return undefined;

    return password_re.test(x) ? x : undefined;
}

type tParse<T> = (x: T) => T | undefined;

function required<T>(fn: tParse<T>, error: string = "") {
    return (x: T) => {
        const value = fn(x);

        if (value === undefined) throw new RouteError(422, error);

        return value;
    };
}

const v = {
    string: required(string, "string esperado"),
    number: required(number, "number esperado"),
    boolean: required(boolean, "boolean esperado"),
    object: required(object, "object esperado"),
    email: required(email, "email invalido"),
    password: required(password, "password invalido"),
    o: {
        string,
        number,
        boolean,
        object,
        email,
        password,
    },
};

export default v;

/* Notas:
Content-length = Header que informa o tamanho do corpo do contéudo em bytes
--Headers podem ser alterados no front/client, por isso não são totalmente confianveis
--Corpo da requisição não tem limite definido, um ataque de negação pode enviar um body com um grande contéudo para interromper o sistema
--ex: a.repeat(50_000_000) = uma string de 50 megabytes
--erro 413, big body, corpo da requisição muito grande

pipes - middlweares que validam tipos de dado e formatam/normalizam dados, segurança para impedir futuros erros ou explorações na aplicação
--> normalize: formata caracteres para igualar
--> escapar: substituir caracteres especiais para que seja tratado como string e não como comando de execução, bind de segurança que evita sql injection ou execução de outros scripts maliciosos
--> sanitizar: normalizar e escapar dados em string (ps: não se sanitiza password, apenas normaliza)
ex: caracteres invisiveis, não aparecem visualmente nem são removidos pelo trim, mas são espaços vazios que ocupam espaço, podem até ser incluidos como assinaturas na escrita de artigos
--> validar: verifica e formata dado do input(aspectos como tamanho, tipo, valor, regex, opções e etc)

ex:
function escapeHtml(x: string) {
  return x
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// zero-width space são caracteres invisíveis, que contam no length
// https://stackoverflow.com/questions/11305797/remove-zero-width-space-characters-from-a-javascript-string
function removeZw(x: string) {
  return x.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");
}

function sanitize(x: string) {
  return removeZw(x).normalize("NFC").trim();
}

//Email - A única forma de validar um email é enviando um código e recebendo a resposta, fora isso não adianta aplicar regex complexos pois apenas valida o valor, não a existência ou pertencimento do email.
// ^ início da string
// [^@]+ 1 ou mais caracteres que não são @
// @ um @
// [^@]+ 1 ou mais caracteres que não são @
// $ fim da string
function email(x: string) {
  return /^[^@]+@[^@]+$/.test(x) ? x : undefined;
}

//cpf
// 146.104.560-60
function cpf(x: string) {
  // 14610456060
  const cpf = x.replace(/\D+/g, "");

  // testa 11111111111, 22222222222 e +
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return undefined;

  let total1 = 0;
  for (let i = 0; i < 9; i++) {
    // 1 * 10 + 4 * 9 + 6 * 8 ...
    total1 += Number(cpf[i]) * (10 - i);
  }
  // 1590 % 11 = 6 % 10 = 6
  const digito1 = ((total1 * 10) % 11) % 10;
  // 6 !== 6
  if (digito1 !== Number(cpf[9])) return undefined;

  let total2 = 0;
  for (let i = 0; i < 10; i++) {
    // 1 * 11 + 4 * 10 + 6 * 9 ...
    total2 += Number(cpf[i]) * (11 - i);
  }
  // 1980 % 11 = 0 % 10 = 0
  const digito2 = ((total2 * 10) % 11) % 10;
  // 0 !== 0
  if (digito2 !== Number(cpf[10])) return undefined;

  return cpf;
} */
