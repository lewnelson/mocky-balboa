import {
  clientIdentityStorage,
  ClientIdentityStorageHeader,
  UnsetClientIdentity,
} from "@mocky-balboa/server";
import { type NextFunction, type Request, type Response } from "express";
import { logger } from "./logger.js";

export const mockyBalboaMiddleware = () => {
  logger.info("Initializing middleware");
  return (req: Request, _res: Response, next: NextFunction) => {
    let clientIdentity = req.headers[ClientIdentityStorageHeader];
    if (typeof clientIdentity !== "string") {
      clientIdentity = UnsetClientIdentity;
    }

    // Ensure client identity is stored in the context before calling the original handler
    return clientIdentityStorage.run(clientIdentity, () => {
      return next();
    });
  };
};
