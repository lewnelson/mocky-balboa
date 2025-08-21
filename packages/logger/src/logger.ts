import { pino } from "pino";

export const createLogger = (packageName: string) =>
  pino({
    transport: {
      target: "pino-pretty",
    },
  }).child({ package: packageName });
