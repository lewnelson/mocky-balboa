import {
  ClientIdentityStorageHeader,
  UnsetClientIdentity,
} from "@mocky-balboa/shared-config";
import { logger } from "./logger.js";
import { clientIdentityStorage } from "./trace.js";

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
const mockyBalboaMiddleware = () => {
  logger.info("Initializing server middleware");
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

export default mockyBalboaMiddleware;
