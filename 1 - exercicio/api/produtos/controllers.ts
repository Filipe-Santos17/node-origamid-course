import type { iCustomReq, iCustomRes, iData } from "../../types/index.d.ts";
import fs from "node:fs/promises";
import path from "node:path";

const dirname = path.resolve();

export default {
    async insertProducts(req: iCustomReq, res: iCustomRes) {
        try {
            const data = req.body as iData;

            if (!("categoria" in data) || !("slug" in data)) {
                return res.json({
                    msg: "Dados de categoria e slug não foram preenchidos",
                });
            }

            const { categoria, slug } = data;

            const pathDir = `${dirname}/api/produtos/${categoria}`;

            try {
                await fs.mkdir(pathDir);
            } catch (e) {}

            await fs.writeFile(
                `${pathDir}/${slug}.json`,
                `${JSON.stringify({ nome: data.nome, preco: data.preco })}`,
            );

            res.json({ msg: "foi" });
        } catch (e) {
            console.error(`Erro: ${e}`);

            res.json({ msg: "erro" });
        }
    },

    async getProducts(req: iCustomReq, res: iCustomRes) {
        try {
        } catch (e) {}
    },
};
