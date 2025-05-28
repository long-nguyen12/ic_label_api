import { filterRequest, optionsRequest } from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Position from "./position.model";
import positionService from "./position.service";
import Customer from "../customer/customer.model";

import { saveLichSuHoatDong } from "../../utils/lichsuhoatdong";
import mongoose from "mongoose";

import { getConfig } from "../../../config/config";
const config = getConfig(process.env.NODE_ENV);

export default {
    async create(req, res) {
        try {
            const { value, error } = positionService.validateCreate(
                req.body,
                "POST"
            );
            if (error) {
                return res.status(400).json(error.details);
            }

            const position = await Position.create(value);

            return res.json(position);
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
            const products = await Position.paginate(query, options);
            return res.json(products);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },

    async findOne(req, res) {
        try {
            const { id } = req.params;
            const position = await Position.findById(id).populate({
                path: "user_id",
                select: "user_full_name",
            });
            if (!position) {
                responseAction.error(res, 404, "");
            }
            return res.json(position);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const position = await Position.findOneAndUpdate(
                { _id: id },
                { is_deleted: true },
                { new: true }
            );
            if (!position) {
                responseAction.error(res, 404, "");
            }
            if (position) {
                saveLichSuHoatDong(req.user._id, 3, position, "products");
            }
            return res.json(position);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },
    async update(req, res) {
        try {
            const { id } = req.params;
            const { value, error } = positionService.validateCreate(
                req.body,
                "PUT"
            );
            if (error && error.details) {
                return responseAction.error(res, 400, error.details[0]);
            }

           
            const position = await Position.findOneAndUpdate({ _id: id }, value, {
                new: true,
            }).populate({ path: "user_id", select: "_id user_full_name" });
            if (!position) {
                responseAction.error(res, 404, "");
            }

            const listCustomer = await Customer.find({position_id: id})

            if (listCustomer) {
                listCustomer.map(async (data) => {
                    await Customer.findByIdAndUpdate({_id: data._id}, {customer_discount: position.position_discount})
                })
            }
            
            if (position) {
                saveLichSuHoatDong(req.user._id, 2, position, "Products");
            }
            return res.json(position);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },
};
