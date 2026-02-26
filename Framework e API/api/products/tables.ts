export const productTables = `
    CREATE TABLE IF NOT EXISTS "products" (
      "id" INTEGER PRIMARY KEY,
      "name" TEXT,
      "slug" TEXT NOT NULL UNIQUE,
      "price" INTEGER 
    );
`;
