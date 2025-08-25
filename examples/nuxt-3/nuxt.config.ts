const mockyBalboaModuleEnabled = process.env.ENABLE_MOCKY_BALBOA === "true";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [["@mocky-balboa/nuxt", { enabled: mockyBalboaModuleEnabled }]],
});
