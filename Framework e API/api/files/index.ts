import { pipeline } from "node:stream/promises";
import { Api } from "../../core/utils/abstract.ts";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { mimeType } from "./utils.ts";
import path from "node:path";
import NotFoundError from "../../core/utils/errors/not-found-error.ts";

export class FilesApi extends Api {
    handlers = {
        //Retorna um arquivo de imagem, pdf entre outros (não recomendado vídeo) com stream
        sendFileStream: async (req, res) => {
            const reqFilePath = req.params.name;
            if (!/^(?!\.)[A-Za-z0-9._-]+$/.test(reqFilePath)) throw new Error("invalido");

            const filePath = `./files/${req.params.name}`;
            const file = createReadStream(filePath);
            const extension = path.extname(filePath).toLowerCase();
            let st;

            try {
                st = await stat(filePath);
            } catch (e) {
                throw new NotFoundError("Arquivo não encontrado");
            }

            //Dados importantes para informação do contéudo
            res.setHeader("Content-Length", st.size);
            res.setHeader("Last-Modified", st.mtime.toUTCString());

            res.setHeader("Content-Type", mimeType[extension] || "application/octet-stream");
            // previne que o browser mude o MIME Type - header de segurança
            res.setHeader("X-Content-Type-Options", "nosniff");

            await pipeline(file, res);
        },

        //Igual ao de cima mas sem stream, pior leitura e uso de memória
        sendFileRead: async (req, res) => {
            const filePath = `./files/${req.params.name}`;
            const file = await readFile(filePath);
            res.end(file);
        },
    } satisfies Api["handlers"];

    routes(): void {
        this.router.get("/files/:name", this.handlers.sendFileStream);
    }
}
