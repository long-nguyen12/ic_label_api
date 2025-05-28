import express from 'express';
import passport from 'passport';
import productController from './product.controller';

const productRouter = express.Router();
productRouter.post('/', passport.authenticate('jwt', { session: false }), productController.create);

productRouter.get('/', passport.authenticate('jwt', { session: false }), productController.findAll);
productRouter.get('/:id', passport.authenticate('jwt', { session: false }), productController.findOne);
productRouter.put('/:id', passport.authenticate('jwt', { session: false }), productController.update)
productRouter.delete('/:id', passport.authenticate('jwt', { session: false }),  productController.delete);

export default productRouter;


