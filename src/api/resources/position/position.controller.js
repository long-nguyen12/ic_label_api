import { filterRequest, optionsRequest } from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Position from "./position.model";
import positionService from "./position.service";

import {
  saveLichSuHoatDong,
  addLichSuHoatDong,
} from "../../utils/lichsuhoatdong";
import mongoose from "mongoose";

import { getConfig } from "../../../config/config";
const config = getConfig(process.env.NODE_ENV);

export default {
  async create(req, res) {
    try {
      const { value, error } = positionService.validateCreate(req.body, "POST");
      if (error) {
        return res.status(400).json(error.details);
      }

      const position = await Position.create(value);
      addLichSuHoatDong(
        req.user._id,
        `Thêm mới vai trò ${position.position_name}`
      );

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
      };
      let query = filterRequest(req_query, true);
      let options = optionsRequest(req_query);
      if (req.query.limit && req.query.limit === "0") {
        options.pagination = false;
      }
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
      const position = await Position.findById(id);
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
        addLichSuHoatDong(
          req.user._id,
          `Xoá vai trò ${position.position_name}`
        );
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
      const { value, error } = positionService.validateCreate(req.body, "PUT");
      if (error && error.details) {
        return responseAction.error(res, 400, error.details[0]);
      }

      const position = await Position.findOneAndUpdate({ _id: id }, value, {
        new: true,
      });
      if (!position) {
        responseAction.error(res, 404, "");
      }

      if (position) {
        addLichSuHoatDong(
          req.user._id,
          `Chỉnh sửa vai trò ${position.position_name}`
        );
      }
      return res.json(position);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
};
