import { filterRequest, optionsRequest } from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Bill from "../salebills/salebills.model";
import carbone from "carbone";
import { getConfig } from "../../../config/config";
const config = getConfig(process.env.NODE_ENV);
import fs from "fs";
import mongoose from "mongoose";
import Salebills from "../salebills/salebills.model";
import Users from "../user/user.model";
import moment from "moment/moment";
import { formatNumber } from "../../utils/utils";
import { resolve } from "path";
import { renderDataToFileTemp } from "./generatefile";

export default {
    async findAll(req, res) {
        let { start, end } = req.query;
        try {
            let data = await Bill.aggregate([
                {
                    $match: {
                        user_id_manager: req.user._id,
                        sale_date: {
                            $gte: new Date(start),
                            $lte: new Date(end + "T23:59:59.999"),
                        },
                    },
                },
                {
                    $group: {
                        _id: "$customer_id",
                        records: { $push: "$$ROOT" },
                        total_pay_all: {
                            $sum: { $toDouble : "$sale_total_payable_all" },
                        },
                        total_pay: {
                            $sum: { $toDouble : "$sale_total_payable_a_discount" },
                        },
                        total_paid: {
                            $sum: { $toDouble : "$sale_bills_paid" },
                        },
                        total_debt: {
                            $sum: { $toDouble : "$sale_bills_debt" },
                        },
                        total_profit_money: {
                            $sum: { $toDouble : "$sale_profit_money" },
                        },
                    },
                },
                {
                    $lookup: {
                        from: "customers",
                        localField: "_id",
                        foreignField: "_id",
                        as: "customer_detail",
                    },
                },
            ]);
            return res.json(data);
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

    async exportReport(req, res) {
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
                { path: "user_id_manager", select: "user_full_name" },
                { path: "customer_id" },
            ];
            options.select = "-password -is_deleted";
            const salebills = await Salebills.paginate(query, options);

            const user = await Users.findById(req.user._id);
            delete user.__v;
            delete user.user_pass;
            let data = {
                ...salebills,
                user,
                now: {
                    fromDate: moment(query.sale_date["$gte"]).format(
                        "DD-MM-YYYY"
                    ),
                    toDate: moment(query.sale_date["$lte"]).format(
                        "DD-MM-YYYY"
                    ),
                    month: moment().format("M"),
                    year: moment().format("Y"),
                },
            };
            let total_sale_total_payable_all = 0;
            let total_sale_total_payable_a_discount = 0;
            let total_sale_bills_paid = 0;
            let total_sale_bills_debt = 0;
            let total_sale_profit_money = 0;


            let newData = data.docs.map((item, index) => {
                total_sale_bills_debt += parseInt(item.sale_bills_debt) || 0;
                total_sale_bills_paid += parseInt(item.sale_bills_paid) || 0;
                total_sale_total_payable_a_discount += parseInt(
                    item.sale_total_payable_a_discount
                );
                total_sale_total_payable_all += parseInt(
                    item.sale_total_payable_all
                );
                total_sale_profit_money += parseInt(
                    item.sale_profit_money
                );
                return {
                    item,
                    sale_date: moment(item.sale_date)
                        .utc()
                        .format("DD-MM-YYYY"),
                    sale_total_payable_all:
                        formatNumber(item.sale_total_payable_all) || 0,
                    sale_total_payable_a_discount:
                        formatNumber(item.sale_total_payable_a_discount) || 0,
                    sale_bills_paid: formatNumber(item.sale_bills_paid) || 0,
                    sale_bills_debt: formatNumber(item.sale_bills_debt) || 0,
                    sale_profit_money: formatNumber(item.sale_profit_money) || 0,
                    index: index + 1,
                };
            });
            data["docs"] = newData;
            data["total_value"] = {
                total_sale_bills_debt: formatNumber(total_sale_bills_debt),
                total_sale_bills_paid: formatNumber(total_sale_bills_paid),
                total_sale_total_payable_a_discount: formatNumber(
                    total_sale_total_payable_a_discount
                ),
                total_sale_total_payable_all: formatNumber(
                    total_sale_total_payable_all
                ),
                total_sale_profit_money: formatNumber(
                    total_sale_profit_money
                ),
            };
            const FILE_INPUT = "public/baocao.xlsx";
            const FILE_OUTPUT = `baocao_${moment().format("DD-MM-YYYY")}.xlsx`;
            const excelAfterRender = await renderDataToFileTemp(
                FILE_INPUT,
                data
            );

            return res.download(excelAfterRender, FILE_OUTPUT);
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },

    async exportSummaryReport(req, res) {
        const FILE_INPUT = "public/baocao.xlsx";
        const FILE_OUTPUT = `baocaotong_${moment().format("DD-MM-YYYY")}.xlsx`;
        const excelAfterRender = await renderDataToFileTemp(FILE_INPUT, data);

        return res.download(excelAfterRender, FILE_OUTPUT);
    },
};
