import { filterRequest, optionsRequest } from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Gallery from "./gallery.model";
import galleryService from "./gallery.service";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

import {
  addLichSuHoatDong,
  saveLichSuHoatDong,
} from "../../utils/lichsuhoatdong";
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
              $size: { $ifNull: ["$image_caption", []] },
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
      ).populate({
        path: "dataset_id",
        select: "dataset_name dataset_path",
      });
      if (!gallery) {
        responseAction.error(res, 404, "");
      }
      if (gallery) {
        addLichSuHoatDong(
          req.user._id,
          `Đã xoá ảnh ${gallery.image_name} trong bộ dữ liệu ${gallery.dataset_id.dataset_name}`
        );
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
      }).populate({
        path: "dataset_id",
        select: "dataset_name dataset_path",
      });
      if (!gallery) {
        return responseAction.error(res, 404, "");
      }

      if (gallery) {
        addLichSuHoatDong(
          req.user._id,
          `Gán nhãn ảnh ${gallery.image_name} trong bộ dữ liệu ${gallery.dataset_id.dataset_name}`
        );
      }

      return res.json(gallery);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async updateByFilename(req, res) {
    try {
      const { name } = req.params;
      const { value, error } = galleryService.validateCreate(req.body, "PUT");
      if (error && error.details) {
        return responseAction.error(res, 400, error.details[0]);
      }

      const gallery = await Gallery.findOneAndUpdate(
        { image_name: name },
        value,
        {
          new: true,
        }
      );
      if (!gallery) {
        return responseAction.error(res, 404, "");
      }

      // if (gallery) {
      //   saveLichSuHoatDong(req.user._id, 2, gallery, "gallerys");
      // }

      return res.json(gallery);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async generateAiImage(req, res) {
    try {
      const { id } = req.params;
      console.log("Generate AI image for gallery_id:", id);
      const gallery = await Gallery.findById(id).populate({
        path: "dataset_id",
        select: "dataset_name dataset_path",
      });
      if (!gallery) {
        return responseAction.error(res, 404, "Gallery not found");
      }
      const FileName = gallery.image_name;
      const PathFolder = gallery.dataset_id.dataset_path;
      const Path = path
        .join(
          __dirname,
          "..",
          "..",
          "..",
          "..",
          PathFolder,
          FileName.replace(/\\/g, "/")
        )
        .replace(/\\/g, "/");

      console.log("Path to image:", Path);

      if (!fs.existsSync(Path)) {
        return res.status(404).json({ error: `File not found: ${Path} ` });
      }

      const formData = new FormData();
      formData.append("file", fs.createReadStream(Path));
      await axios
        .post("https://icai.ailabs.io.vn/v1/api/detection", formData, {
          headers: {
            ...formData.getHeaders(),
          },
        })
        .then(async (response) => {
          console.log("response.data", response.data);
          const linkBoximg =
            `https://icai.ailabs.io.vn/v1/api/images/` +
            response.data.dectect_path.split("/").pop();
          const gallery = await Gallery.findOneAndUpdate(
            { _id: id },
            { image_detection: linkBoximg },
            {
              new: true,
            }
          ).populate({
            path: "dataset_id",
            select: "dataset_name dataset_path",
          });
          res.status(200).json(gallery);
        })
        .catch((error) => {
          console.error(`Lỗi upload: ${Path}`, error.message);
          res.status(500).json({ error: error.message });
        });
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
};
