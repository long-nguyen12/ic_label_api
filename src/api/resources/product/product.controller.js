import { filterRequest, optionsRequest } from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Product from "./product.model";
import productService from "./product.service";

import { saveLichSuHoatDong } from "../../utils/lichsuhoatdong";
import mongoose from "mongoose";

import { getConfig } from "../../../config/config";
const config = getConfig(process.env.NODE_ENV);

export default {
    async create(req, res) {
        try {
            const { value, error } = productService.validateCreate(
                req.body,
                "POST"
            );
            if (error) {
                return res.status(400).json(error.details);
            }

            const product = await Product.create(value);

            return res.json(product);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },
    async findAll(req, res) {
        try {
            let req_query = {
                ...req.query,
                user_id: { equal: mongoose.Types.ObjectId(req.user._id) },
            };
            let query = filterRequest(req_query, true);
            let options = optionsRequest(req_query);
            if (req.query.limit && req.query.limit === "0") {
                options.pagination = false;
            }
            options.populate = [{ path: "user_id", select: "user_full_name" }];
            const products = await Product.paginate(query, options);
            return res.json(products);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },

    async findOne(req, res) {
        try {
            const { id } = req.params;
            const product = await Product.findById(id).populate({
                path: "user_id",
                select: "user_full_name",
            });
            if (!product) {
                responseAction.error(res, 404, "");
            }
            return res.json(product);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const product = await Product.findOneAndUpdate(
                { _id: id },
                { is_deleted: true },
                { new: true }
            );
            if (!product) {
                responseAction.error(res, 404, "");
            }
            if (product) {
                saveLichSuHoatDong(req.user._id, 3, product, "products");
            }
            return res.json(product);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },
    async update(req, res) {
        try {
            const { id } = req.params;
            const { value, error } = productService.validateCreate(
                req.body,
                "PUT"
            );
            if (error && error.details) {
                return responseAction.error(res, 400, error.details[0]);
            }

            const user = await Product.findOneAndUpdate({ _id: id }, value, {
                new: true,
            }).populate({ path: "user_id", select: "_id user_full_name" });
            if (!user) {
                responseAction.error(res, 404, "");
            }

            if (user) {
                saveLichSuHoatDong(req.user._id, 2, user, "Products");
            }
            return res.json(user);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },
};
