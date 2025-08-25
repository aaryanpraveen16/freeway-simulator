// vite.config.ts
import { defineConfig } from "file:///app/node_modules/vite/dist/node/index.js";
import react from "file:///app/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///app/node_modules/lovable-tagger/dist/index.js";
import tailwindcss from "file:///app/node_modules/tailwindcss/lib/index.js";
import autoprefixer from "file:///app/node_modules/autoprefixer/lib/autoprefixer.js";
var __vite_injected_original_dirname = "/app";
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
      host: "127.0.0.1",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9hcHAvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICd0YWlsd2luZGNzcyc7XG5pbXBvcnQgYXV0b3ByZWZpeGVyIGZyb20gJ2F1dG9wcmVmaXhlcic7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGlzRGV2ID0gbW9kZSA9PT0gJ2RldmVsb3BtZW50JztcbiAgXG4gIHJldHVybiB7XG4gICAgYmFzZTogJy8nLCAvLyBURU1QOiBVc2Ugcm9vdCBmb3IgbG9jYWwgcHJldmlld1xuICAgIHB1YmxpY0RpcjogJ3B1YmxpYycsIC8vIFVzZSB0aGUgcHVibGljIGRpcmVjdG9yeSBmb3Igc3RhdGljIGFzc2V0c1xuICAgIGNzczoge1xuICAgICAgbW9kdWxlczogZmFsc2UsXG4gICAgICBkZXZTb3VyY2VtYXA6IGlzRGV2LFxuICAgICAgcG9zdGNzczoge1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgdGFpbHdpbmRjc3MoKSxcbiAgICAgICAgICBhdXRvcHJlZml4ZXIoKSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgICBhc3NldHNJbmxpbmVMaW1pdDogMCwgLy8gRGlzYWJsZSBpbmxpbmUgYXNzZXRzXG4gICAgICBtaW5pZnk6ICFpc0RldiwgLy8gT25seSBtaW5pZnkgaW4gcHJvZHVjdGlvblxuICAgICAgc291cmNlbWFwOiBpc0RldiwgLy8gT25seSBnZW5lcmF0ZSBzb3VyY2VtYXBzIGluIGRldmVsb3BtZW50XG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIGlucHV0OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnaW5kZXguaHRtbCcpLFxuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uW2hhc2hdLmpzJyxcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uW2hhc2hdLmpzJyxcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uW2hhc2hdW2V4dG5hbWVdJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiMTI3LjAuMC4xXCIsXG4gICAgICBwb3J0OiAzMDAwLFxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgIHJlYWN0KCksXG4gICAgICBpc0RldiAmJiBjb21wb25lbnRUYWdnZXIoKSxcbiAgICBdLmZpbHRlcihCb29sZWFuKSBhcyBhbnlbXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4TCxTQUFTLG9CQUFvQjtBQUMzTixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBQ2hDLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sa0JBQWtCO0FBTHpCLElBQU0sbUNBQW1DO0FBUXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sUUFBUSxTQUFTO0FBRXZCLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQTtBQUFBLElBQ04sV0FBVztBQUFBO0FBQUEsSUFDWCxLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUEsTUFDVCxjQUFjO0FBQUEsTUFDZCxTQUFTO0FBQUEsUUFDUCxTQUFTO0FBQUEsVUFDUCxZQUFZO0FBQUEsVUFDWixhQUFhO0FBQUEsUUFDZjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixhQUFhO0FBQUEsTUFDYixXQUFXO0FBQUEsTUFDWCxjQUFjO0FBQUEsTUFDZCxtQkFBbUI7QUFBQTtBQUFBLE1BQ25CLFFBQVEsQ0FBQztBQUFBO0FBQUEsTUFDVCxXQUFXO0FBQUE7QUFBQSxNQUNYLGVBQWU7QUFBQSxRQUNiLE9BQU8sS0FBSyxRQUFRLGtDQUFXLFlBQVk7QUFBQSxRQUMzQyxRQUFRO0FBQUEsVUFDTixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxRQUNsQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsSUFDZDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sU0FBUyxnQkFBZ0I7QUFBQSxJQUMzQixFQUFFLE9BQU8sT0FBTztBQUFBLElBQ2hCLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
