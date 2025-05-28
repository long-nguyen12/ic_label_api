import {filterRequest, optionsRequest} from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Salebills from "./salebills.model";
import salebillsService from "./salebills.service";
import SalebillsdetailModel from "../salebillsdetail/salebillsdetail.model";
import {saveLichSuHoatDong} from "../../utils/lichsuhoatdong";

import {getConfig} from "../../../config/config";

const config = getConfig(process.env.NODE_ENV);
import mongoose from "mongoose";
import salebillsdetailModel from "../salebillsdetail/salebillsdetail.model";

export default {
    async create(req, res) {
        try {
            const {value, error} = salebillsService.validateCreate(
                req.body,
                "POST"
            );
            if (error) {
                return res.status(400).json(error.details);
            }
            const bill = await Salebills.findOne({sale_id: value.sale_id});
            if (bill) {
                return res.status(400).json({
                    success: false,
                    message: "Mã hoá đơn đã tồn tại",
                });
            }
            // Lợi nhuận của chị Thư trong đơn hàng
            let sale_profit_discount = parseInt(value.user_discount) - parseInt(value.sale_position_discount);
            // Tiền đơn hàng đã trừ chiết khấu
            let sale_total_payable_a_discount = value.sale_total_payable_a_discount ? value.sale_total_payable_a_discount : 0;
            // Chiết khấu đơn hàng
            let discount =  100 - parseInt(value.sale_position_discount);
            // Tiền chiết khấu đơn hàng
            let moneyDiscount = (parseInt(value.sale_position_discount) * sale_total_payable_a_discount) / discount
            // Tiền đơn hàng không tính chiết khấu
            let sale_all_money_not_discount =  parseInt(moneyDiscount) + parseInt(sale_total_payable_a_discount);
            // Tiền lợi nhuận của chị Thư
            let sale_profit_money = sale_profit_discount * parseInt(sale_all_money_not_discount)  / 100;

            value.sale_all_money_not_discount = sale_all_money_not_discount;
            value.sale_profit_money = sale_profit_money;
            value.sale_profit_discount = sale_profit_discount;
            value.sale_user_discount = value.user_discount;

            const data = await Salebills.create(value);
            if (data) {
                value.sale_bills_detail.map(async (item) => {
                    item.user_id_manager = req.user._id
                    item.salebills_id = data._id;
                    delete item._id;
                    await SalebillsdetailModel.create(item);
                });
            }
            return res.json(data);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },
    async findAll(req, res) {
        try {
            let req_query = {
                ...req.query,
                user_id_manager: {
                    equal: mongoose.Types.ObjectId(req.user._id),
                },
            };
            let query = filterRequest(req_query, true);
            let options = optionsRequest(req_query);
            if (req.query.limit && req.query.limit === "0") {
                options.pagination = false;
            }
            options.populate = [
                {path: "user_id_manager", select: "user_full_name"},
                {path: "customer_id", populate: { path : "position_id"}},
            ];
            console.log(options,'options')
            options.select = "-password -is_deleted";
            const salebills = await Salebills.paginate(query, options);
            return res.json(salebills);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },

    async findOne(req, res) {
        try {
            const {id} = req.params;
            const customer = await Salebills.findById(id).populate({
                path: "user_id",
                select: "user_name",
            });
            if (!customer) {
                responseAction.error(res, 404, "");
            }
            return res.json(customer);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },

    async delete(req, res) {
        try {
            const {id} = req.params;
            const salebills = await Salebills.findOneAndUpdate(
                {_id: id},
                {is_deleted: true},
                {new: true}
            );
            if (!salebills) {
                responseAction.error(res, 404, "");
            }
            if (salebills) {
                let arrsalebillsdetailDel = await salebillsdetailModel.find({salebills_id: salebills._id});
                if (arrsalebillsdetailDel) {
                    arrsalebillsdetailDel.map(async (data) => {
                        await salebillsdetailModel.findByIdAndUpdate({_id: data._id}, {is_deleted: true})
                    })
                }
                // salebillsdetailModel.updateMany({salebills_id: salebills._id}, {"$set": {"is_deleted": true}})
                saveLichSuHoatDong(req.user._id, 3, salebills, "salebills");
            }
            return res.json(salebills);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },
    async update(req, res) {
        try {
            const {id} = req.params;
            const {value, error} = salebillsService.validateCreate(
                req.body,
                "PUT"
            );
            if (error && error.details) {
                return responseAction.error(res, 400, error.details[0]);
            }
            // Lợi nhuận của chị Thư trong đơn hàng
            let sale_profit_discount = parseInt(value.user_discount) - parseInt(value.sale_position_discount);
            // Tiền đơn hàng đã trừ chiết khấu
            let sale_total_payable_a_discount = value.sale_total_payable_a_discount ? value.sale_total_payable_a_discount : 0;
            // Chiết khấu đơn hàng
            let discount =  100 - parseInt(value.sale_position_discount);
            // Tiền chiết khấu đơn hàng
            let moneyDiscount = 0;
            if(parseInt(value.user_discount) !== parseInt(value.sale_position_discount)) {
                moneyDiscount = (parseInt(value.sale_position_discount) * sale_total_payable_a_discount) / parseInt(discount)
            } 
            // Tiền đơn hàng không tính chiết khấu
            let sale_all_money_not_discount =  parseInt(moneyDiscount) + parseInt(sale_total_payable_a_discount);
            // Tiền lợi nhuận của chị Thư
            let sale_profit_money = sale_profit_discount * parseInt(sale_all_money_not_discount)  / 100;

            value.sale_all_money_not_discount = sale_all_money_not_discount;
            value.sale_profit_money = sale_profit_money;
            value.sale_profit_discount = sale_profit_discount;
            value.sale_user_discount = value.user_discount;
            // Cập nhật salebillsdetail
            // Nếu có thêm mới hoặc sửa salebillsdetail thì thực hiện kiểm tra
            // Nếu _id chứa ADD thì thêm mới
            // Nếu _id thường thì cần update giá trị
            if (value.sale_bills_detail && value.sale_bills_detail.length > 0) {
                value.sale_bills_detail.map(async (item) => {
                    if (item._id.slice(0, 3) === "ADD") {
                        // console.log("Thêm mới phản phẩm của salebills");
                        item.salebills_id = id;
                        item.user_id_manager = req.user._id
                        delete item._id;
                        let dataDetailAdd = await SalebillsdetailModel.create(
                            item
                        );
                        if (dataDetailAdd) {
                            // console.log(
                            //   "Thêm mới phản phẩm của salebills thành công"
                            // );
                        }
                    } else {
                        // console.log("Update phản phẩm của salebills");
                        let dataDetailEdit =
                            await SalebillsdetailModel.findOneAndUpdate(
                                {_id: item._id},
                                item,
                                {
                                    new: true,
                                }
                            );
                        if (dataDetailEdit) {
                            // console.log(
                            //   "Update phản phẩm của salebills thành công"
                            // );
                        }
                    }
                });
            }
            if (value.sale_bills_detail_delete && value.sale_bills_detail_delete.length > 0) {
                value.sale_bills_detail_delete.map(async (item) => {
                    if (item._id.slice(0, 3) !== "ADD") {
                        // console.log("Delete phản phẩm của salebills");
                        let dataDetailDelete =
                            await SalebillsdetailModel.findOneAndUpdate(
                                {_id: item._id},
                                {is_deleted: true},
                                {
                                    new: true,
                                }
                            );
                        if (dataDetailDelete) {
                            // console.log(
                            //   "Delete phản phẩm của salebills thành công"
                            //);
                        }
                    }
                });
            }
            const salebills = await Salebills.findOneAndUpdate(
                {_id: id},
                value,
                {
                    new: true,
                }
            );
            if (!salebills) {
                responseAction.error(res, 404, "");
            }
            if (salebills) {
                saveLichSuHoatDong(req.user._id, 2, salebills, "salebills");
            }
            return res.json(salebills);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },
};
