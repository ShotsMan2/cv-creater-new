import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  transport: isProduction
    ? {
        target: "pino/file",
        options: { destination: 1 },
      }
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-api-key']",
      "body.password",
      "body.token",
      "body.secret",
    ],
    censor: "[REDACTED]",
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        "user-agent": req.headers?.["user-agent"],
        "content-type": req.headers?.["content-type"],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

export function createRequestLogger(req: Request, startTime: number) {
  return {
    info: (message: string, extra?: Record<string, unknown>) => {
      logger.info({
        message,
        requestId: req.headers.get("x-request-id"),
        method: req.method,
        url: req.url,
        duration: Date.now() - startTime,
        ...extra,
      });
    },
    warn: (message: string, extra?: Record<string, unknown>) => {
      logger.warn({
        message,
        requestId: req.headers.get("x-request-id"),
        method: req.method,
        url: req.url,
        duration: Date.now() - startTime,
        ...extra,
      });
    },
    error: (message: string, error?: unknown, extra?: Record<string, unknown>) => {
      logger.error({
        message,
        requestId: req.headers.get("x-request-id"),
        method: req.method,
        url: req.url,
        duration: Date.now() - startTime,
        err: error,
        ...extra,
      });
    },
  };
}
