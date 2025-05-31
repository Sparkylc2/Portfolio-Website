import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					runtimeCompiler: true,
					isCustomElement: (tag) => tag === "math-field",
				},
			},
		}),
	],
});
