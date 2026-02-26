/*
Todo dado é inserido na memória ram quando utilizado, seja string, boolean, arquivos e etc
- O readfile coloca o arquivo inteiro temporariamente na memória (5 arquivos de 200 mega já é 1 giga da ram), o body parser também consome memória
- Para utilizar melhor a mémoria é necessário dividir o arquivo /dado em chunks (pedaços). O tamanho de cada chunk é dito por uma propriedade conhecida como highWaterMark, sendo cerca de 64kb para leitura e 16kb para escrita por padrão.
- Chuncks de json tendem a ser único pois 64kb são 64 mil caracteres
- createReadStream e createWriteStream
ex:
*/
import { createReadStream, createWriteStream } from "node:fs";
import { createInterface } from "node:readline/promises";
import { createServer } from "node:http";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
import { Transform } from "node:stream";

export default function receiveFileStream(i: number) {
    const readF = createReadStream("./file.txt");
    const writeF = createWriteStream(`./new-file-${i}.txt`);
    pipeline(readF, writeF);
}

for (let i = 0; i < 20; i++) {
    receiveFileStream(i);
}

//readF.toArray() -- une todos as streams e coloca o arquivo inteiro na mémoria de uma única vez, como o readFile - ps: não faz sentido caso queira evitar tratar grandes arquivos de uma vez

//streams e eventos - cada maniupalação de data, inicio ou fim de manipulação é um evento na leitura do stream
//ex:

function readStream_onData() {
    const file = createReadStream("./dados.json");
    const chunks: any[] = [];
    file.on("data", (chunk) => {
        chunks.push(chunk);
    }).on("end", () => {
        const data = Buffer.concat(chunks).toString();
        const body = JSON.parse(data);
        console.log(body);
    });
}

/*
- write = Escreve/envia o chunk para o destino.
- end = Finaliza a stream e envia um chunk final.
- flags = Opções da stream: a - append (adiciona ao arquivo, cria se não existir), w - write (escreve por cima, cria se não existir), r - read, x - (ax, wx - apenas se não existir).
*/

//exemplo - escrita de log em um arquivo txt com streams
const log = createWriteStream("./log.txt", { flags: "a" });

const server = createServer(async (req, res) => {
    log.write(`${req.method} ${req.socket.remoteAddress} ${req.url} \n`);
    res.end();
});

server.listen(3000).on("close", () => {
    log.end();
});

/* 
pipeline = função do node que conecta stream de leitura (Readable stream) com stream de saída (Writeable stream)
--pipelines emitem erros que podem ser tratados com try / catch (ps o que é puxado pelo node:stream/promises)
--Em caso de erro a pipeline de leitura não é fechada, por isso é necessário um tratamento ao final
--Backpressure = momento que a leitura ocorre mais rápida que a escrita, então pausa a leitura até a escrita acabar e conseguir acompanhar
--Todo Readable stream possui o metodo pipe, para unir a saída da função a outra entrada
--Entre .pipe e pipeline dê preferência ao pipeline
*/

ex: createServer(async (req, res) => {
    try {
        const read = createReadStream("./dados.json");
        await pipeline(read, res); //dados do arquivo json são enviandos no body do res
    } catch (error) {
        res.statusCode = 500;
        res.end("error");
    }
}).listen(3000);

//leitura e escrita padrão
await pipeline(createReadStream("./entrada.txt"), createWriteStream("./saida.txt")); //o arquivo de saída é gerado igual ao de entrada

// transform - transformar o dado entre a leitura e a escrita da stream, um middleware entre leitura e escrita que permite agir como um pipe (validações e transformações)

const transform = new Transform({
    transform(chunk: Buffer, _enc, next) {
        const text = chunk.toString().toUpperCase();
        this.push(text); //adiciona o chunk no dado de stream, normal pula a etapa - ps adicione chunk ou string, write file não funciona com objs e array
        next(); // função que sinaliza que a proxima variavel pode ocorrer (pula leitura e segue escrita), pode recebe 2 params: Error | null, chunk
    },
});

await pipeline(createReadStream("./entrada.txt"), transform, createWriteStream("./saida.txt"));

// Problema da abordagem acima: O chunck pode estar incompleto quando vira string, isso interromperia a transformação para json por que daria erro, caso ela exista, para isso converta o arquivos json em ndjson

//transform zip - Existem funções nativas que funcionam como uma Transform stream, como a createGzip que irá comprimir os dados antes da escrita deles e o createGunzip para descomprimir a stream.

try {
    await pipeline(createReadStream("./entrada.txt"), createGzip(), createWriteStream("./saida.txt.gz"));
} catch (error) {
    console.error(error);
}

/*
json comum:
[
  { "a":"b"},
  { "a":"b"}
]

ndjson:
{ "a":"b"}
{ "a":"b"}
*/

//ex:
const read = createReadStream("./pessoas.ndjson");
const write = createWriteStream("./pessoas-vitalicio.ndjson");
const lines = createInterface({ input: read, crlfDelay: Infinity });

for await (const line of lines) {
    const obj = JSON.parse(line);
    if (obj.vitalicio === "true") write.write(line + "\n");
}

write.end();

//Servir arquivos:
// -> O node não é proprío para servir arquivos estáticos, utilize o nginx ou um deposito/bucket como s3
