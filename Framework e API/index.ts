import { AuthApi } from "./api/auth/index.ts";
import { FilesApi } from "./api/files/index.ts";
import { LmsApi } from "./api/lms/index.ts";
import { Core } from "./core/index.ts";
import { logger } from "./core/middleware/logger.ts";
import { rateLimit } from "./core/middleware/rate-limit.ts";

const core = new Core();

core.router.use([logger, rateLimit(10_000, 100)]);

new AuthApi(core).init();
new LmsApi(core).init();
new FilesApi(core).init();

//Object.fromEntries(formData) - transforma form data em obj

core.init(8000, "Running...");
