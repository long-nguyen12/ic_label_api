import express from "express";
import passport from "passport";
import galleryController from "./gallery.controller";

const galleryRouter = express.Router();
galleryRouter.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  galleryController.create
);

galleryRouter.get(
  "/generate-ai-image/:id",
  passport.authenticate("jwt", { session: false }),
  galleryController.generateAiImage
);
galleryRouter.get(
  "/all",
  passport.authenticate("jwt", { session: false }),
  galleryController.findAllCaptions
);
galleryRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  galleryController.findAll
);
galleryRouter.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  galleryController.findOne
);
galleryRouter.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  galleryController.update
);
galleryRouter.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  galleryController.delete
);
galleryRouter.put("/", galleryController.updateByFilename);
galleryRouter.get(
  "/rotate-left/:id",
  passport.authenticate("jwt", { session: false }),
  galleryController.rotateImageCounterclockwise
);
galleryRouter.get(
  "/rotate-right/:id",
  passport.authenticate("jwt", { session: false }),
  galleryController.rotateImageClockwise
);
galleryRouter.get(
  "generate-captions/:id",
  passport.authenticate("jwt", { session: false }),
  galleryController.generateAICaptions
);

export default galleryRouter;
