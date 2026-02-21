import type { IncomingMessage, ServerResponse } from "node:http";

export interface iCustomReq extends IncomingMessage {
    query: URLSearchParams;
    pathname: string;
    method: string;
    body: Record<string, any>;
}

export interface iCustomRes extends ServerResponse {
    status: (sts: number) => iCustomRes;
    json: (data: Record<string, any>) => void;
}

export interface iData {
    nome: string;
    slug: string;
    categoria: string;
    preco: number;
}
