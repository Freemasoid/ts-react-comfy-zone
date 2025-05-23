import "dotenv/config";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import { Server } from "http";
import connectDB from "./db/connect.js";
import { config } from "./config/index.js";
import { setupRoutes } from "./routes/index.js";
import path from "path";
import { fileURLToPath } from "url";
// Middleware
import { notFoundMiddleware } from "./middleware/not-found.js";
import { logger, enhancedErrorHandler } from "./middleware/error-handler.js";
import { setupCommonMiddleware } from "./middleware/index.js";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse JSON bodies BEFORE routes
app.use(express.json({ limit: "2mb" }));

// Setup common middleware
setupCommonMiddleware(app);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://cdn.jsdelivr.net https://github.githubassets.com https://challenges.cloudflare.com https://clerk-telemetry.com https://accounts.google.com; " +
      "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.dev https://collector.github.com https://api.github.com https://clerk-telemetry.com https://accounts.google.com; " +
      "frame-src 'self' https://*.clerk.accounts.dev https://github.com https://accounts.google.com https://challenges.cloudflare.com; " +
      "img-src 'self' https://*.clerk.accounts.dev https://img.clerk.com https://github.githubassets.com https://avatars.githubusercontent.com https://*.googleusercontent.com https://res.cloudinary.com; " +
      "style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://github.githubassets.com; " +
      "worker-src 'self' blob:; " +
      "font-src 'self' https://*.clerk.accounts.dev;"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
});

// Add request debugging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({
    message: "Incoming request",
    method: req.method,
    path: req.path,
    headers: {
      authorization: req.headers.authorization ? "Bearer [REDACTED]" : "none",
      origin: req.headers.origin,
      host: req.headers.host,
    },
  });
  next();
});

// Setup routes for REST API
setupRoutes(app);

// Serve static frontend files in production
if (process.env.NODE_ENV === "production") {
  // Serve static files
  app.use(express.static(path.join(__dirname, "../../dist")));

  // Send all other requests to the client app
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../dist/index.html"));
  });

  logger.info("Serving frontend static files");
}

// Handle 404 errors for API routes
app.use("/api/*", notFoundMiddleware);

// Handle errors
app.use(enhancedErrorHandler);

// Start the server
const PORT = config.port;

let server: Server;

const start = async () => {
  try {
    await connectDB(config.mongoUri as string);
    logger.info("Connected to MongoDB");

    server = app.listen(PORT, () => {
      logger.info(`Server is listening on port ${PORT}...`);
    });
  } catch (error) {
    logger.error({
      message: "Error starting server",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

start();

process.on("unhandledRejection", (err) => {
  logger.error({
    message: "UNHANDLED REJECTION! 💥 Shutting down...",
    error: err instanceof Error ? err.message : String(err),
  });
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
