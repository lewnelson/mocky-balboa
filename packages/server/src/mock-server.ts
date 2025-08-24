import {
  http,
  HttpResponse,
  passthrough,
  type DefaultBodyType,
  type StrictRequest,
} from "msw";
import { setupServer } from "msw/node";
import { type RawData } from "ws";
import { clientIdentityStorage } from "./trace.js";
import { logger } from "./logger.js";
import {
  connections,
  type WebSocketConnectionState,
} from "./connection-state.js";
import {
  Message,
  MessageType,
  parseMessage,
} from "@mocky-balboa/websocket-messages";
import { UnsetClientIdentity } from "@mocky-balboa/shared-config";

/**
 * Processes the request to retrieve a response from the client falling back to passing the request through to the target URL.
 *
 * @param connectionState - the WebSocket connection state containing the WebSocket connection
 * @param requestId - unique identifier for the request
 * @param request - the request object
 * @param timeoutDuration - the duration in milliseconds to wait for a response from the client
 * @returns A mock service worker HTTP response
 */
const getResponseFromClient = async (
  connectionState: WebSocketConnectionState,
  requestId: string,
  request: StrictRequest<DefaultBodyType>,
  timeoutDuration: number,
): Promise<HttpResponse<string>> => {
  const requestBody = await new Response(request.body).text();
  return new Promise<HttpResponse<string>>((resolve, reject) => {
    const timeout = setTimeout(() => {
      connectionState.ws.off("message", onMessage);
      reject(new Error("Request timed out"));
    }, timeoutDuration);

    function onMessage(data: RawData) {
      try {
        const message = parseMessage(data.toString());

        switch (message.type) {
          case MessageType.RESPONSE:
            // Not concerning our request
            if (message.payload.id !== requestId) {
              return;
            }

            if (message.payload.error) {
              resolve(HttpResponse.error());
            } else {
              if (!message.payload.response) {
                resolve(passthrough());
              } else {
                resolve(
                  new HttpResponse(message.payload.response.body, {
                    status: message.payload.response.status,
                    headers: message.payload.response.headers,
                  }),
                );
              }
            }

            clearTimeout(timeout);
            connectionState?.ws.off("message", onMessage);

            connectionState?.ws.send(
              new Message(MessageType.ACK, {}, message.messageId).toString(),
            );
            break;
        }
      } catch (error) {
        logger.error({ error }, "Error occurred while processing message");
      }
    }

    connectionState.ws.on("message", onMessage);

    const message = new Message(MessageType.REQUEST, {
      id: requestId,
      request: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: requestBody,
      },
    });

    connectionState.ws.send(message.toString());
  });
};

export interface MockServerOptions {
  /**
   * Time out for the mock server to receive a response from the client
   *
   * @default 5000
   */
  timeout?: number;
}

/**
 * Sets up mock service worker to handle all requests via the WebSocket client connections
 */
export const bindMockServiceWorker = ({
  timeout = 5000,
}: MockServerOptions = {}) => {
  const server = setupServer(
    http.all("*", async (req) => {
      const clientIdentity = clientIdentityStorage.getStore();
      if (!clientIdentity || clientIdentity === UnsetClientIdentity) {
        logger.info({ req: req.request }, "Not identified");
        return passthrough();
      }

      const connectionState = connections.get(clientIdentity);
      if (!connectionState) {
        logger.warn({ req: req.request }, "Client connection not found");
        return passthrough();
      }

      try {
        const response = await getResponseFromClient(
          connectionState,
          req.requestId,
          req.request,
          timeout,
        );
        return response;
      } catch (error) {
        console.log("error retrieving response from client");
        logger.error(
          { error },
          "Error occurred while attempting to resolve response",
        );

        const errorMessage = new Message(MessageType.ERROR, {
          id: req.requestId,
          message: error instanceof Error ? error.message : "Unknown error",
        });

        connectionState.ws.send(errorMessage.toString());

        return HttpResponse.error();
      }
    }),
  );

  server.listen({ onUnhandledRequest: "bypass" });
};
