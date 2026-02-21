import { DatabaseSync, type StatementSync } from "node:sqlite";

export class Database extends DatabaseSync {
    queries: Record<string, StatementSync>;

    constructor(path: string) {
        super(path);

        this.queries = {};

        this.exec(`
            PRAGMA foreign_keys = 1;
            PRAGMA journal_mode = DELETE;
            PRAGMA synchronous = NORMAL;

            PRAGMA cache_size = 2000;
            PRAGMA busy_timeout = 5000;
            PRAGMA temp_store= MEMORY;
        `);
    }

    query(sql: string) {
        //Use query em vez do exec para fazer cache, ps: faz cachê a partir da query statica do sql, que acelera o processo de converter a string em query, independente do parametro
        //Use sempre com query("...").get(var), nunca substitua o var na query pois assim cacheia a query com valor fixo, não dinâmico, e isso acumula e causa vazamento de memoria
        if (!this.queries[sql]) {
            this.queries[sql] = this.prepare(sql);
        }

        return this.queries[sql];
    }
}
