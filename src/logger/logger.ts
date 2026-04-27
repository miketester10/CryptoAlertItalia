import pino from "pino";

export const logger = pino({
  base: null, // <-- rimuove pid ed hostname
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "SYS:dd-mm-yyyy HH:MM:ss", // <-- formato data e ora
      colorize: true,
    },
  },
  level: "debug",
});