import express from "express";
import filesController from "./files.controller";

const filesRouter = express.Router();

filesRouter.route("/:id").get(filesController.findFileById);
filesRouter.route("/")
    .post(filesController.create)
    .get(filesController.getDocument);

export default filesRouter;
