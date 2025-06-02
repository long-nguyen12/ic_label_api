import express from 'express';
import passport from 'passport';
import galleryController from './gallery.controller';

const galleryRouter = express.Router();
galleryRouter.post('/', passport.authenticate('jwt', { session: false }), galleryController.create);

galleryRouter.get('/', passport.authenticate('jwt', { session: false }), galleryController.findAll);
galleryRouter.get('/:id', passport.authenticate('jwt', { session: false }), galleryController.findOne);
galleryRouter.put('/:id', passport.authenticate('jwt', { session: false }), galleryController.update)
galleryRouter.delete('/:id', passport.authenticate('jwt', { session: false }),  galleryController.delete);

export default galleryRouter;


