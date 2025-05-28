import express from "express";
import passport from "passport";
import reportController from "./report.controller";

const reportRouter = express.Router();

reportRouter.get(
    "/",
    passport.authenticate("jwt", { session: false }),
    reportController.findAll
);
reportRouter.get(
    "/export",
    passport.authenticate("jwt", { session: false }),
    reportController.exportReport
);
reportRouter.get(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    reportController.findOne
);

export default reportRouter;
