const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config/config");
const logger = require("./utils/logger");
const { handleError } = require("./utils/errorHandler");
const callRoutes = require("./routes/callRoutes");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",")
        : "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("combined", { stream: logger.stream }));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/calls", callRoutes);

app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message: `Cannot ${req.method} ${req.url}`,
  });
});

app.use(handleError);

mongoose
  .connect(config.mongodb.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("Connected to MongoDB");

    const server = app.listen(config.server.port, () => {
      logger.info(`Server is running on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
    });

    process.on("unhandledRejection", (err) => {
      logger.error("UNHANDLED REJECTION! Shutting down...", err);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on("uncaughtException", (err) => {
      logger.error("UNCAUGHT EXCEPTION! Shutting down...", err);
      process.exit(1);
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        logger.info("Process terminated!");
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    logger.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

module.exports = app;
