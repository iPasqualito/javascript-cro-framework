import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {

    return {
        root: "src",
        build: {
            outDir: "../dist",
            emptyOutDir: true, // also necessary
            rollupOptions: {
                output: {
                    entryFileNames: "framework.js",
                    assetFileNames: "style.css"
                }
            }
        }
    };
});
