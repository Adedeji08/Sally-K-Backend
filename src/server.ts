import { app } from "./app.js";
import { env } from "./config/env.js";
import { activateMaturedPoints } from "./modules/loyalty/loyalty.service.js";

app.listen(env.PORT, () => {
  console.log(`Server is running at http://localhost:${env.PORT}`);
});

// Flips PENDING loyalty points (past their hold period) to ACTIVE so they
// become spendable. A plain interval is enough for a single-instance server;
// running more than one instance would need a real job scheduler/lock
// instead so the sweep doesn't run redundantly on every instance.
const POINTS_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
setInterval(() => {
  activateMaturedPoints().catch((err) => console.error("Failed to activate matured loyalty points:", err));
}, POINTS_SWEEP_INTERVAL_MS);
activateMaturedPoints().catch((err) => console.error("Failed to activate matured loyalty points:", err));
