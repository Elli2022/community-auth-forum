export default function createLogger({ format, transports }) {
  const filePath = process.env.NODE_LOG_PATH;
  const { combine, printf, colorize, json } = format;

  const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  });

  const consoleTransport = new transports.Console({
    level: "http",
    format: combine(colorize(), logFormat),
  });

  const fileTransports = filePath
    ? [
        new transports.File({
          filename: `${filePath}/error.log`,
          handleExceptions: true,
          maxsize: 5242880,
          maxFiles: 5,
          level: "error",
          format: combine(json()),
        }),
        new transports.File({
          filename: `${filePath}/all.log`,
          handleExceptions: true,
          maxsize: 5242880,
          maxFiles: 5,
          level: "http",
          format: combine(json()),
        }),
      ]
    : [];

  return Object.freeze({
    logger: () => [consoleTransport, ...fileTransports],
  });
}
