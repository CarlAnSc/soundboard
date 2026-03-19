import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ⚠️  Change "soundboard" below to match your GitHub repository name exactly.
//     e.g. if your repo is github.com/yourname/my-sounds  →  base: "/my-sounds/"
export default defineConfig({
  plugins: [react()],
  base: "/soundboard/",
});
