import { createServer } from "node:http";
import { customRequest, customResponse } from "./core/index.ts";
import router from "./api/produtos/routers.ts";

const server = createServer(async (request, response) => {
    const req = await customRequest(request);
    const res = await customResponse(response);

    //@ts-ignore
    const handlerFunc = router.findRouter(req.method, req.pathname);

    if (handlerFunc) {
        await handlerFunc(req, res);
    } else {
        const notFoundMsg = { msg: "Rota não encontrada" };

        res.status(404).json(notFoundMsg);
    }
});

server.listen(8000, () => console.log("Running..."));
