import 'dotenv/config'

import express from "express";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import { connect } from "./config/db";
import { restRouter } from "./api";
import { restDanhMucRouter } from "./api/danhmucRouter";
import swaggerDocument from "./config/swagger.json";
import { configJWTStrategy } from "./api/middlewares/passport-jwt";
import bodyParser from "body-parser";
const cron = require("cron");

const index = express();
const PORT = process.env.PORT || 3006;

connect();

index.use(express.json());

index.use(bodyParser.json({ limit: "2gb" }));
index.use(
  bodyParser.urlencoded({
    limit: "2gb",
    extended: true,
    parameterLimit: 1000000,
  })
);

index.use(express.urlencoded({ extended: true }));

index.use(passport.initialize()); // req.user
configJWTStrategy();

index.use("/uploads", express.static("uploads"));

index.use("/api", restRouter);
index.use("/api", restDanhMucRouter);
index.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: false,
  })
);

index.use("/api/*", (req, res) => {
  return res.status(404).json({ success: false, message: "API không tồn tại" });
});

index.use("/api/*", (req, res, next) => {
  const error = new Error("Not found");
  error.message = "Invalid route";
  error.status = 404;
  next(error);
});

index.use("/api/*", (error, req, res, next) => {
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
