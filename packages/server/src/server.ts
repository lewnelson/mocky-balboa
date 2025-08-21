import {
  startWebSocketServer,
  type WebSocketServerOptions,
} from "./websocket-server.js";
import {
  bindMockServiceWorker,
  type MockServerOptions,
} from "./mock-server.js";

export interface ServerOptions {
  /**
   * Options for the WebSocket server
   */
  webSocketServerOptions?: WebSocketServerOptions;
  /**
   * Options for the mock server
   */
  mockServerOptions?: MockServerOptions;
}

/**
 * Starts the mock server and WebSocket server
 */
export const startServer = async ({
  webSocketServerOptions = {},
}: ServerOptions = {}) => {
  await Promise.all([
    startWebSocketServer(webSocketServerOptions),
    bindMockServiceWorker(),
  ]);
};

export { clientIdentityStorage } from "./trace.js";
