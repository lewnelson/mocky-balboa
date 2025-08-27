import {
  clientIdentityStorage,
  ClientIdentityStorageHeader,
  UnsetClientIdentity,
} from "@mocky-balboa/server";
import { logger } from "./logger.js";

/**
 * Request like object compatible with Express v4 and v5
 */
export interface Request {
  headers:
    | Record<string, string | string[]>
    | NodeJS.Dict<string | string[]>
    | Headers;
}

/**
 * Middleware next function
 */
export type NextFunction = () => void | Promise<void>;

/**
 * Express middleware for Mocky Balboa compatible with other frameworks following
 * the express middleware pattern.
 */
export const mockyBalboaMiddleware = () => {
  logger.info("Initializing middleware");
  return (req: Request, _res: any, next: NextFunction) => {
    let clientIdentity =
      req.headers instanceof Headers
        ? req.headers.get(ClientIdentityStorageHeader)
        : req.headers[ClientIdentityStorageHeader];

    if (typeof clientIdentity !== "string") {
      clientIdentity = UnsetClientIdentity;
    }

    // Ensure client identity is stored in the context before calling the original handler
    return clientIdentityStorage.run(clientIdentity, () => {
      return next();
    });
  };
};

export { startServer } from "@mocky-balboa/server";
