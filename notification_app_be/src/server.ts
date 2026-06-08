import app from "./app";
import { config } from "./config";
import { Log } from "./utils/logger";

const PORT = config.port;

app.listen(PORT, async () => {
  await Log("backend", "info", "config", `Server running on port ${PORT}`);
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
