import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const webPort = Number(process.env.CURADH_WEB_PORT ?? 5174);
const apiPort = Number(process.env.CURADH_API_PORT ?? 3101);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: webPort,
    strictPort: true,
    proxy: {
      "/api": `http://127.0.0.1:${apiPort}`
    }
  }
});
