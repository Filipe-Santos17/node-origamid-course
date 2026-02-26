import { Api } from "../../core/utils/abstract.ts";
import RouteError from "../../core/utils/route-error.ts";
import { productTables } from "./tables.ts";

export class ProductsApi extends Api {
    handlers = {
        //NOTA: Arrow Function Obrigatória para o This funcionar
        getProducts: (req, res) => {
            const { slug } = req.params;

            const product = this.db
                .query(`SELECT * FROM "products" WHERE "slug" = ?`)
                .get(slug);

            if (!product) {
                throw new RouteError(404, "produto não encontrado");
            }

            res.status(200).json(product);
        },
    } satisfies Api["handlers"];

    tables() {
        this.db.exec(productTables);
    }

    routes() {
        this.router.get("/products/:slug", this.handlers.getProducts);
    }
}
