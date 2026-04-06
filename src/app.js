import 'dotenv/config'

import express from "express";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import { connect } from "./config/db";
import { restRouter } from "./api";
import swaggerDocument from "./config/swagger.json";
import { configJWTStrategy } from "./api/middlewares/passport-jwt";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getConfig } from "./config/config";

const index = express();
const PORT = process.env.PORT || 3006;
const config = getConfig(process.env.NODE_ENV);

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const jsonLimit = process.env.REQUEST_BODY_LIMIT || "10mb";
const parameterLimit = toNumber(process.env.PARAMETER_LIMIT, 10000);
const staticMaxAgeMs = toNumber(process.env.STATIC_MAX_AGE_MS, 60 * 60 * 1000);
const corsOrigin = process.env.CORS_ORIGIN;
const rateLimitWindowMs = toNumber(
  process.env.RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000
);
const rateLimitMax = toNumber(process.env.RATE_LIMIT_MAX, 300);

if (process.env.NODE_ENV === "production") {
  if (!config.secret || config.secret === "MY APP") {
    console.error("JWT secret is not set. Define JWT_SECRET in production.");
    process.exit(1);
  }
}

connect();

index.disable("x-powered-by");
index.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
index.use(compression());

index.use(
  cors({
    origin: corsOrigin
      ? corsOrigin.split(",").map((origin) => origin.trim()).filter(Boolean)
      : true,
  })
);
index.use(express.json({ limit: jsonLimit }));
index.use(
  express.urlencoded({
    limit: jsonLimit,
    extended: true,
    parameterLimit,
  })
);

index.use(passport.initialize()); // req.user
configJWTStrategy();

const apiLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});

index.use(
  "/uploads",
  express.static("uploads", {
    dotfiles: "ignore",
    maxAge: staticMaxAgeMs,
  })
);

index.use("/api", apiLimiter);
index.use("/api", restRouter);
index.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: false,
  })
);

index.use("/api", (req, res, next) => {
  const error = new Error("API not found");
  error.status = 404;
  next(error);
});

index.use((error, req, res, next) => {
  res.status(error.status || 500);
  return res.json({
    error: {
      message: error.message,
    },
  });
});

// let server = require('http').createServer(index);

index.listen(PORT, () => {
  console.log(`Server is running at PORT http://localhost:${PORT}`);
});
