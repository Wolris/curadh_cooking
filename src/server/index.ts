import { buildServer } from "./app.js";

const app = buildServer();
const port = Number(process.env.PORT ?? 3101);

try {
  await app.listen({ host: "127.0.0.1", port });
  console.log(`Curadh Cooking API listening at http://127.0.0.1:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
