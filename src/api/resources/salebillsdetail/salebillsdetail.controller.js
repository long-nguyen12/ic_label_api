import {filterRequest, optionsRequest} from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Salebillsdetail from "./salebillsdetail.model";
import salebillsdetailService from "./salebillsdetail.service";
import {saveLichSuHoatDong} from "../../utils/lichsuhoatdong";

import mongoose from "mongoose";

export default {
  async create(req, res) {
    try {
      const {value, error} = salebillsdetailService.validateCreate(
        req.body,
        "POST"
      );
      if (error) {
        return res.status(400).json(error.details);
      }

      const customer = await Salebillsdetail.create(value);

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
        user_id_manager: {equal: mongoose.Types.ObjectId(req.user._id)},
      };
      let query = filterRequest(req_query, true);
      let options = optionsRequest(req_query);
      if (req.query.limit && req.query.limit === "0") {
        options.pagination = false;
      }
      options.populate = [{path: "user_id_manager", select: "user_full_name"}, {path: "product_id", select: "product_name"}];
      options.select = "-password -is_deleted";
      const salebillsdetail = await Salebillsdetail.paginate(query, options);
      return res.json(salebillsdetail);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async findOne(req, res) {
    try {
      const {id} = req.params;
      const data = await Salebillsdetail.findById(id).populate({
        path: "user_id",
        select: "user_name",
      });
      if (!data) {
        responseAction.error(res, 404, "");
      }
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async delete(req, res) {
    try {
      const {id} = req.params;
      const data = await Salebillsdetail.findOneAndUpdate(
        {_id: id},
        {is_deleted: true},
        {new: true}
      );
      if (!data) {
        responseAction.error(res, 404, "");
      }
      if (data) {
        saveLichSuHoatDong(req.user._id, 3, data, "salebillsdetail");
      }
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async update(req, res) {
    try {
      const {id} = req.params;
      const {value, error} = salebillsdetailService.validateCreate(
        req.body,
        "PUT"
      );
      if (error && error.details) {
        return responseAction.error(res, 400, error.details[0]);
      }
      const data = await Salebillsdetail.findOneAndUpdate({_id: id}, value, {
        new: true,
      }).populate({path: "user_id", select: "_id user_full_name"});
      if (!data) {
        responseAction.error(res, 404, "");
      }

      if (data) {
        saveLichSuHoatDong(req.user._id, 2, data, "salebillsdetail");
      }
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
};
