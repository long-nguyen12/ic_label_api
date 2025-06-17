import express from "express";
import filesController from "./files.controller";

export const filesRouter = express.Router();
filesRouter.route("/:id").get(filesController.findFileById);
filesRouter.route("/").post(filesController.create);
filesRouter.route("/document").get(filesController.getDocument);
