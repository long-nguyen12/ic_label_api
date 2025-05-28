import express from 'express';
import passport from 'passport';
import customerController from './customer.controller';

const customerRouter = express.Router();
customerRouter.post('/', passport.authenticate('jwt', { session: false }), customerController.create);

customerRouter.get('/', passport.authenticate('jwt', { session: false }), customerController.findAll);
customerRouter.get('/:id', passport.authenticate('jwt', { session: false }), customerController.findOne);
customerRouter.put('/:id', passport.authenticate('jwt', { session: false }), customerController.update)
customerRouter.delete('/:id', passport.authenticate('jwt', { session: false }),  customerController.delete);

export default customerRouter;


