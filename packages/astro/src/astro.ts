import { startServer, type ServerOptions } from "@mocky-balboa/server";
import type { AstroIntegration } from "astro";

export interface MockyBalboaIntegrationOptions {
  serverOptions?: ServerOptions;
}

/**
 * Starts up the Mocky Balboa server and registers the middleware required to intercept server side network requests.
 *
 * {@link https://docs.mocky-balboa.com}
 */
const mockyBalboaIntegration = (
  options: MockyBalboaIntegrationOptions = {},
): AstroIntegration => ({
  name: "@mocky-balboa/astro",
  hooks: {
    // Dev server started
    "astro:server:start": async ({ logger }) => {
      logger.info("Starting Mocky Balboa server");
      await startServer(options.serverOptions);
      logger.info("Mocky Balboa server started");
    },
    // Inject middleware
    "astro:config:setup": ({ addMiddleware, updateConfig, logger }) => {
      logger.info("Setting config.output to 'server'");
      updateConfig({
        output: "server",
      });

      logger.info("Registering Mocky Balboa middleware");
      addMiddleware({
        entrypoint: "@mocky-balboa/astro/middleware",
        order: "pre",
      });
      logger.info("Mocky Balboa middleware registered");
    },
  },
});

export default mockyBalboaIntegration;
