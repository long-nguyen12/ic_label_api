import { filterRequest, optionsRequest } from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Dataset from "./dataset.model";
import datasetService from "./dataset.service";
import Gallery from "../gallery/gallery.model";
import { saveLichSuHoatDong } from "../../utils/lichsuhoatdong";
import mongoose from "mongoose";

import { getConfig } from "../../../config/config";
const config = getConfig(process.env.NODE_ENV);

export default {
  async create(req, res) {
    try {
      const { value, error } = datasetService.validateCreate(req.body, "POST");
      if (error) {
        return res.status(400).json(error.details);
      }

      const dataset = await Dataset.create(value);
      if (dataset) {
        const exts = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
        if (!fs.existsSync(dataset_path)) return [];
        const images = await fs
          .readdirSync(dataset_path)
          .filter((file) => exts.includes(path.extname(file).toLowerCase()))
          .map((file) => path.join(dataset_path, file));
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const gallery = await Gallery.create({
            dataset_id: dataset._id,
            image_name: path.basename(image),
          });
        }
      }

      return res.json(dataset);
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
      const products = await Dataset.paginate(query, options);
      return res.json(products);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async findOne(req, res) {
    try {
      const { id } = req.params;
      const dataset = await Dataset.findById(id);
      if (!dataset) {
        responseAction.error(res, 404, "");
      }
      return res.json(dataset);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const dataset = await Dataset.findOneAndUpdate(
        { _id: id },
        { is_deleted: true },
        { new: true }
      );
      if (!dataset) {
        responseAction.error(res, 404, "");
      }
      if (dataset) {
        saveLichSuHoatDong(req.user._id, 3, dataset, "datasets");
      }
      return res.json(dataset);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async update(req, res) {
    try {
      const { id } = req.params;
      const { value, error } = datasetService.validateCreate(req.body, "PUT");
      if (error && error.details) {
        return responseAction.error(res, 400, error.details[0]);
      }

      const dataset = await Dataset.findOneAndUpdate({ _id: id }, value, {
        new: true,
      });
      if (!dataset) {
        responseAction.error(res, 404, "");
      }

      if (dataset) {
        saveLichSuHoatDong(req.user._id, 2, dataset, "datasets");
      }
      return res.json(dataset);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
};
