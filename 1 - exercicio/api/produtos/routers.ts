import { Router } from "../../core/index.ts";
import controllers from "./controllers.ts";

const router = new Router();

const key_path = "/produtos/";

router.post(key_path, controllers.insertProducts);
router.get(key_path, controllers.getProducts);

export default router;
