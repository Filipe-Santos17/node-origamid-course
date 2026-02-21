import { AuthApi } from "./api/auth/index.ts";
import { LmsApi } from "./api/lms/index.ts";
import { Core } from "./core/index.ts";

const core = new Core();

new AuthApi(core).init();
new LmsApi(core).init();

//Object.fromEntries(formData) - transforma form data em obj

core.init(8000, "Running...");
