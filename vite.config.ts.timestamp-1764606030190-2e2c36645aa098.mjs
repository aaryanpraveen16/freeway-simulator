// vite.config.ts
import { defineConfig } from "file:///C:/freeway-simulator/node_modules/vite/dist/node/index.js";
import react from "file:///C:/freeway-simulator/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/freeway-simulator/node_modules/lovable-tagger/dist/index.js";
import tailwindcss from "file:///C:/freeway-simulator/node_modules/tailwindcss/lib/index.js";
import autoprefixer from "file:///C:/freeway-simulator/node_modules/autoprefixer/lib/autoprefixer.js";
var __vite_injected_original_dirname = "C:\\freeway-simulator";
var vite_config_default = defineConfig(({ mode }) => {
  const isDev = mode === "development";
  return {
    base: "/",
    // TEMP: Use root for local preview
    publicDir: "public",
    // Use the public directory for static assets
    css: {
      modules: false,
      devSourcemap: isDev,
      postcss: {
        plugins: [
          tailwindcss(),
          autoprefixer()
        ]
      }
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      assetsDir: "assets",
      cssCodeSplit: true,
      assetsInlineLimit: 0,
      // Disable inline assets
      minify: !isDev,
      // Only minify in production
      sourcemap: isDev,
      // Only generate sourcemaps in development
      rollupOptions: {
        input: path.resolve(__vite_injected_original_dirname, "index.html"),
        output: {
          entryFileNames: "assets/[name].[hash].js",
          chunkFileNames: "assets/[name].[hash].js",
          assetFileNames: "assets/[name].[hash][extname]"
        }
      }
    },
    server: {
      host: "::",
      port: 3e3,
      strictPort: true
    },
    plugins: [
      react(),
      isDev && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxmcmVld2F5LXNpbXVsYXRvclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcZnJlZXdheS1zaW11bGF0b3JcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L2ZyZWV3YXktc2ltdWxhdG9yL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICd0YWlsd2luZGNzcyc7XHJcbmltcG9ydCBhdXRvcHJlZml4ZXIgZnJvbSAnYXV0b3ByZWZpeGVyJztcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICBjb25zdCBpc0RldiA9IG1vZGUgPT09ICdkZXZlbG9wbWVudCc7XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2U6ICcvJywgLy8gVEVNUDogVXNlIHJvb3QgZm9yIGxvY2FsIHByZXZpZXdcclxuICAgIHB1YmxpY0RpcjogJ3B1YmxpYycsIC8vIFVzZSB0aGUgcHVibGljIGRpcmVjdG9yeSBmb3Igc3RhdGljIGFzc2V0c1xyXG4gICAgY3NzOiB7XHJcbiAgICAgIG1vZHVsZXM6IGZhbHNlLFxyXG4gICAgICBkZXZTb3VyY2VtYXA6IGlzRGV2LFxyXG4gICAgICBwb3N0Y3NzOiB7XHJcbiAgICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgICAgdGFpbHdpbmRjc3MoKSxcclxuICAgICAgICAgIGF1dG9wcmVmaXhlcigpLFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxyXG4gICAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxyXG4gICAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXHJcbiAgICAgIGFzc2V0c0lubGluZUxpbWl0OiAwLCAvLyBEaXNhYmxlIGlubGluZSBhc3NldHNcclxuICAgICAgbWluaWZ5OiAhaXNEZXYsIC8vIE9ubHkgbWluaWZ5IGluIHByb2R1Y3Rpb25cclxuICAgICAgc291cmNlbWFwOiBpc0RldiwgLy8gT25seSBnZW5lcmF0ZSBzb3VyY2VtYXBzIGluIGRldmVsb3BtZW50XHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBpbnB1dDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2luZGV4Lmh0bWwnKSxcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS5baGFzaF0uanMnLFxyXG4gICAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLltoYXNoXS5qcycsXHJcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uW2hhc2hdW2V4dG5hbWVdJyxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiBcIjo6XCIsXHJcbiAgICAgIHBvcnQ6IDMwMDAsXHJcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICByZWFjdCgpLFxyXG4gICAgICBpc0RldiAmJiBjb21wb25lbnRUYWdnZXIoKSxcclxuICAgIF0uZmlsdGVyKEJvb2xlYW4pIGFzIGFueVtdLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9O1xyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrUCxTQUFTLG9CQUFvQjtBQUMvUSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBQ2hDLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sa0JBQWtCO0FBTHpCLElBQU0sbUNBQW1DO0FBUXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sUUFBUSxTQUFTO0FBRXZCLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQTtBQUFBLElBQ04sV0FBVztBQUFBO0FBQUEsSUFDWCxLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUEsTUFDVCxjQUFjO0FBQUEsTUFDZCxTQUFTO0FBQUEsUUFDUCxTQUFTO0FBQUEsVUFDUCxZQUFZO0FBQUEsVUFDWixhQUFhO0FBQUEsUUFDZjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixhQUFhO0FBQUEsTUFDYixXQUFXO0FBQUEsTUFDWCxjQUFjO0FBQUEsTUFDZCxtQkFBbUI7QUFBQTtBQUFBLE1BQ25CLFFBQVEsQ0FBQztBQUFBO0FBQUEsTUFDVCxXQUFXO0FBQUE7QUFBQSxNQUNYLGVBQWU7QUFBQSxRQUNiLE9BQU8sS0FBSyxRQUFRLGtDQUFXLFlBQVk7QUFBQSxRQUMzQyxRQUFRO0FBQUEsVUFDTixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxRQUNsQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsSUFDZDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sU0FBUyxnQkFBZ0I7QUFBQSxJQUMzQixFQUFFLE9BQU8sT0FBTztBQUFBLElBQ2hCLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
