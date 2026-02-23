import { createHmac, scrypt, timingSafeEqual, type BinaryLike, type ScryptOptions } from "node:crypto";
import { promisify } from "node:util";
import { randomBytesAsync } from "../utils.ts";

const scryptPasswordAsync: (
    password: BinaryLike,
    salt: BinaryLike,
    keylen: number,
    options?: ScryptOptions,
) => Promise<Buffer> = promisify(scrypt);

//Hash 256 é rápido, por isso impróprio para criar senhas, o algoritmo precisa ser mais lento e custoso para garantir que desvendar a senha por força bruta (várias tentativas) seja inviável
//algoritmo scrypt é segura e nativa no node
//salt - valor aleatório para que senhas iguais tenham valores diferentes
//dkLen - tamanho de saída da senha
//Parâmetros (N,r e p)
//Ps: Overload = função que possui 2 ou mais assinaturas diferentes, quando a função possui overload o promissify busca somente a 1º assinatura, cada assinatura pode ter diferentes números de parâmetros com diferentes tipos
//raibow tables - tabelas de senhas fracas / comum

//HMAC - Hit Mac = secret/ pepper(sal e pimenta) adicionado à senha antes de derivar o hash com scrypt - encripta e depois encripta de novo

export class PasswordService {
    PEPPER: string;
    SCRYPT_OPTIONS: ScryptOptions = {
        N: 2 ** 14, //Quanto de mémoria na cpu vai utilizar, sempre na base 2, acima de 15 pede o maxmem para especificar o máximo/limite de mémoria que o algoritmo pode utilizar
        r: 8, //block-size
        p: 16, //paralelismo - numéro de iterações paralelas,
    };
    NORM = "NFC";
    DK_LEN = 32;
    SALT_LEN = 16;

    constructor(pepper: string) {
        this.PEPPER = pepper;
    }

    async encryptPassword(password: string, salt_buffer?: Buffer) {
        //caracteres diferentes podem ser visualmente iguais, o truque é apenas uma questão de usabilidade
        const password_normalized = password.normalize(this.NORM);

        //o pepper não pode mudar se não todas as senhas mudam
        const password_hmac = createHmac("sha256", this.PEPPER).update(password_normalized).digest();

        const salt = salt_buffer ?? (await randomBytesAsync(this.SALT_LEN)); //32 caracteres

        // 64 caracteres sempre, devido ao keylen de 32
        //o 1º parâmetro - password, pode ser string ou Buffer
        const password_hash = await scryptPasswordAsync(password_hmac, salt, this.DK_LEN, this.SCRYPT_OPTIONS);

        if (salt_buffer) {
            return password_hash;
        }

        return this.hashPassword(salt, password_hash); // é preciso salvar o salt para possibilitar recriar a senha com o mesmo valor, ps: não está sendo revertido, está fornecendo os mesmos parâmetros, logo deve dar o mesmo resultado
    }

    private async hashPassword(salt: Buffer, dk: Buffer) {
        return (
            `scrypt$v=1$norm=${this.NORM}$N=${this.SCRYPT_OPTIONS.N},r=${this.SCRYPT_OPTIONS.r},p=${this.SCRYPT_OPTIONS.p}` +
            `$${salt.toString("hex")}$${dk.toString("hex")}`
        );
    }

    parsePasswordHash(password_hash: string) {
        const parts = password_hash.split("$");

        const [id, v, norm, options, stored_salt_hex, stored_dk_hex] = parts;

        //converte valores de Buffer para hexadezcimal
        const stored_salt = Buffer.from(stored_salt_hex, "hex");
        const stored_dk = Buffer.from(stored_dk_hex, "hex");

        const stored_norm = norm.replace("norm=", "");

        const stored_options = options.split(",").reduce((acc: Record<string, any>, kv) => {
            const [k, v] = kv.split("=", 2);
            acc[k] = Number(v);
            return acc;
        }, {});

        return { stored_salt, stored_dk, stored_options, stored_norm, id, v };
    }

    async verifyPassword(password: string, password_hash: string) {
        try {
            const { stored_salt, stored_dk } = this.parsePasswordHash(password_hash);

            const dk = (await this.encryptPassword(password, stored_salt)) as Buffer;

            if (dk.length !== stored_dk.length) return false;

            //Teste de encriptação pode resultar em valores de tempo diferentes a depender da proximidade da senha (senhas muito diferentes da uma resposta mais rapida, e mais parecidas é mais lento), isso da uma dica a atacantes, a função timingSafeEqual do node garante que o retorno de tempo da resposta seja o mesmo independente da proximidade da senha
            return timingSafeEqual(dk, stored_dk);
        } catch (_) {
            return false;
        }
    }
}
