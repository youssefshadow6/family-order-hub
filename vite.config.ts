import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // تفعيل محرك السيرفر لـ Vercel عشان يقرأ الصفحات صح
  nitro: true, 
  vite: {
    base: './',
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});