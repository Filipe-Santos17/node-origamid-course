import { createHash, randomBytes } from "node:crypto";
import { promisify } from "node:util";

// randomBytes - gera buffers com código aleatórios seguros
// promisify - transforma funções que possuem callback em promises que podem utilizar async await
// ps: randomBytes é sincrono, o que interrompe o eventloop, assincrono não interrompe
export const randomBytesAsync = promisify(randomBytes);

// sha - secure hashing algorithm - sempre possui um hash de 32 bytes / 256 bits de saída independente do tamanho da entrada
// createHash - gera um hash irreversível
export function hashCode256(hash: string) {
    return createHash("sha256").update(hash).digest(); // por padrão retorna em buffer, mas o parametro do digest define o tipo
}

//hex = valores hexadecimais de 0 a f
//base64 = String Aa-zZ, numeros(0-9) + / e padding = (espaço vazio que termina com =)
//base64url = igual ao base64 porém toda / vira _ e o +  vira -, sem o = no final, assim é seguro para urls
