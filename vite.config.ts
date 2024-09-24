import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    vue(),
    AutoImport({
      dirs: [],
      imports: ["vue"],
      dts: "src/types/auto-import.d.ts", //  会自动生成此文件
    }),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false, // css in js
        }),
      ],
      dts: "src/types/components.d.ts",
      // 指定组件位置，默认是src/components
      dirs: [],
    }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "src/style/variables.less";`,
      },
    },
  },
});
