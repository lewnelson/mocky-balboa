import type { NitroAppPlugin } from "nitropack";
import type { NitroRuntimeConfig } from "nitropack/types";
import { useRuntimeConfig } from "nitropack/runtime";
import { RuntimeConfigKey, type MockyBalboaModuleOptions } from "./config.js";
import {
  clientIdentityStorage,
  ClientIdentityStorageHeader,
  startServer,
  UnsetClientIdentity,
} from "@mocky-balboa/server";
import { logger } from "./logger.js";
import pinoPretty from "pino-pretty";
import type { EventHandler } from "h3";

// Required to ensure pino-pretty is bundled for Nuxt as it's only referenced as a path
// in calling pino() on transport
pinoPretty();

/**
 * Starts the Mocky Balboa server. Should only be called once at runtime.
 */
export default <NitroAppPlugin>async function (app) {
  const config: NitroRuntimeConfig = useRuntimeConfig();

  const originalHandler = app.h3App.handler;

  // Update the handler to wrap the original handler with client identity storage
  const appHandler: EventHandler = async (event) => {
    let clientIdentity = event.node.req.headers[ClientIdentityStorageHeader];
    if (typeof clientIdentity !== "string") {
      clientIdentity = UnsetClientIdentity;
    }

    // Ensure client identity is stored in the context before calling the original handler
    return clientIdentityStorage.run(clientIdentity, () => {
      return originalHandler(event);
    });
  };

  // Update the handler
  app.h3App.handler = appHandler;

  // Get the options from the runtime config
  // The module persists the options to runtime config
  const options = config?.[RuntimeConfigKey] as
    | MockyBalboaModuleOptions
    | undefined;

  logger.info(
    { serverOptions: options?.serverOptions },
    "Starting Mocky Balboa server",
  );

  // Start the WebSocket server and mock service worker
  await startServer(options?.serverOptions);
};
