import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Fail instead of moving to 8081 when 8080 is busy: 8081 is Keycloak, and a dev server there hides the sign-in page.
    // 8080 is also the address registered on the Keycloak client (redirect after login).
    strictPort: true,
    hmr: {
      overlay: false,
    },
    // InstaGPU backend: the BFF (bff-service) serves /bff/auth/* and /bff/api/*. Same origin for the browser, so the HttpOnly
    // session cookie and the CSRF cookie are first-party. Override the target with BFF_URL if the BFF is not on :3000.
    proxy: {
      "/bff": { target: process.env.BFF_URL ?? "http://localhost:3000", changeOrigin: false, xfwd: true },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
