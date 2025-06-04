import { filterRequest, optionsRequest } from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Gallery from "./gallery.model";
import galleryService from "./gallery.service";

import { saveLichSuHoatDong } from "../../utils/lichsuhoatdong";
import mongoose from "mongoose";

import { getConfig } from "../../../config/config";
const config = getConfig(process.env.NODE_ENV);

export default {
  async create(req, res) {
    try {
      const { value, error } = galleryService.validateCreate(req.body, "POST");
      if (error) {
        return res.status(400).json(error.details);
      }

      const gallery = await Gallery.create(value);

      return res.json(gallery);
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
      options.populate = [
        { path: "dataset_id", select: "dataset_name dataset_path" },
      ];
      const galleries = await Gallery.paginate(query, options);
      return res.json(galleries);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async findAllCaptions(req, res) {
    try {
      let req_query = {
        ...req.query,
      };
      let query = filterRequest(req_query, true);
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            captionCount: {
              $size: {
                $objectToArray: { $ifNull: ["$image_caption", {}] },
              },
            },
          },
        },
        { $match: { captionCount: { $gte: 5 } } },
      ];
      let options = optionsRequest(req_query);
      if (req.query.limit && req.query.limit === "0") {
        options.pagination = false;
      }
      options.populate = [
        { path: "dataset_id", select: "dataset_name dataset_path" },
      ];
      const galleries = await Gallery.aggregate(pipeline);
      return res.json(galleries);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async findOne(req, res) {
    try {
      let req_query = {
        ...req,
      };
      console.log("req_query", req_query);
      let query = filterRequest(req_query, true);
      let options = optionsRequest(req_query);
      if (req.query.limit && req.query.limit === "0") {
        options.pagination = false;
      }
      options.populate = [
        { path: "dataset_id", select: "dataset_name dataset_path" },
      ];

      const { id } = req.params;
      const gallery = await Gallery.findById(id).populate({
        path: "dataset_id",
        select: "dataset_name dataset_path",
      });
      if (!gallery) {
        responseAction.error(res, 404, "");
      }
      return res.json(gallery);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const gallery = await Gallery.findOneAndUpdate(
        { _id: id },
        { is_deleted: true },
        { new: true }
      );
      if (!gallery) {
        responseAction.error(res, 404, "");
      }
      if (gallery) {
        saveLichSuHoatDong(req.user._id, 3, gallery, "gallerys");
      }
      return res.json(gallery);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async update(req, res) {
    try {
      const { id } = req.params;
      const { value, error } = galleryService.validateCreate(req.body, "PUT");
      if (error && error.details) {
        return responseAction.error(res, 400, error.details[0]);
      }

      const gallery = await Gallery.findOneAndUpdate({ _id: id }, value, {
        new: true,
      });
      if (!gallery) {
        responseAction.error(res, 404, "");
      }

      if (gallery) {
        saveLichSuHoatDong(req.user._id, 2, gallery, "gallerys");
      }
      return res.json(gallery);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
};
