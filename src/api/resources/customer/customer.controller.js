import {filterRequest, optionsRequest} from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Customer from "./customer.model";
import customerService from "./customer.service";

import {saveLichSuHoatDong} from "../../utils/lichsuhoatdong";

import mongoose from "mongoose";
import salebillsModel from "../salebills/salebills.model";
import salebillsdetailModel from "../salebillsdetail/salebillsdetail.model";

export default {
  async create(req, res) {
    try {
      const {value, error} = customerService.validateCreate(
        req.body,
        "POST"
      );
      if (error) {
        return res.status(400).json(error.details);
      }
      let customerInfo = await Customer.findOne({
        $or: [
          {
            customer_email: value.customer_email,
            user_id: req.user._id,
          },
          {
            customer_mobi: value.customer_mobi,
            user_id: req.user._id,
          },
        ],
      });
      if (customerInfo) {
        if (value.customer_email === customerInfo.customer_email) {
          return res.status(400).json({
            success: false,
            message: "Email đã được đăng ký",
          });
        } else if (value.customer_mobi === customerInfo.customer_mobi) {
          return res.status(400).json({
            success: false,
            message: "Số điện thoại đã được đăng ký",
          });
        }
      }
      const customer = await Customer.create(value);

      return res.json(customer);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async findAll(req, res) {
    try {
      let req_query = {
        ...req.query,
        user_id: {equal: mongoose.Types.ObjectId(req.user._id)},
      };
      let query = filterRequest(req_query, true);
      let options = optionsRequest(req_query);
      if (req.query.limit && req.query.limit === "0") {
        options.pagination = false;
      }
      options.populate = [{path: "user_id", select: "user_full_name"}, {path: "position_id"}];
      options.select = "-password -is_deleted";
      const customers = await Customer.paginate(query, options);
      return res.json(customers);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async findOne(req, res) {
    try {
      const {id} = req.params;
      const customer = await Customer.findOne({
        _id: id,
        user_id: req.user._id,
      }).populate({
        path: "user_id",
        select: "user_full_name",
      }).populate({
        path: "position_id",
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
      const customer = await Customer.findOneAndUpdate(
        {_id: id, user_id: req.user._id},
        {is_deleted: true},
        {new: true}
      );
      if (!customer) {
        responseAction.error(res, 404, "");
      }
      if (customer) {
        let arrSalebillsDel = await salebillsModel.find({customer_id: customer._id});
        if (arrSalebillsDel) {
          {
            arrSalebillsDel.map(async (data) => {
              let salebillsAfterDel = await salebillsModel.findByIdAndUpdate({_id: data._id}, {is_deleted: true}, {new: true})
              if (salebillsAfterDel) {
                let arrsalebillsdetailDel = await salebillsdetailModel.find({salebills_id: salebillsAfterDel._id});
                if (arrsalebillsdetailDel) {
                  arrsalebillsdetailDel.map(async (data) => {
                    await salebillsdetailModel.findByIdAndUpdate({_id: data._id}, {is_deleted: true})
                  })
                }
              }
            })
          }
        }
        // await salebillsModel.updateMany({customer_id: customer._id}, {is_deleted: true})
        saveLichSuHoatDong(req.user._id, 3, customer, "customers");
      }
      return res.json(customer);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async update(req, res) {
    try {
      const {id} = req.params;
      const {value, error} = customerService.validateCreate(
        req.body,
        "PUT"
      );
      if (error && error.details) {
        return responseAction.error(res, 400, error.details[0]);
      }

      let userInfo = await Customer.findOne({
        $and: [
          {_id: {$ne: id}, user_id: req.user._id},
          {$or: [{customer_email: value.customer_email}]},
        ],
      });
      if (userInfo) {
        if (value.customer_email === userInfo.customer_email) {
          return res.status(400).json({
            success: false,
            message: "Email đã được đăng ký",
          });
        }
      }

      const user = await Customer.findOneAndUpdate({_id: id}, value, {
        new: true,
      }).populate({path: "user_id", select: "_id user_full_name"});
      if (!user) {
        responseAction.error(res, 404, "");
      }

      if (user) {
        saveLichSuHoatDong(req.user._id, 2, user, "customers");
      }
      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
};
