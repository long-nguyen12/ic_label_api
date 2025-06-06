import { filterRequest, optionsRequest } from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Dataset from "./dataset.model";
import datasetService from "./dataset.service";
import Gallery from "../gallery/gallery.model";
import {
  saveLichSuHoatDong,
  addLichSuHoatDong,
} from "../../utils/lichsuhoatdong";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
var sizeOf = require("image-size");

import { getConfig } from "../../../config/config";
const config = getConfig(process.env.NODE_ENV);

export default {
  async create(req, res) {
    try {
      const { value, error } = datasetService.validateCreate(req.body, "POST");
      if (error) {
        return res.status(400).json(error.details);
      }
      const foundDataset = await Dataset.findOne({
        dataset_name: value.dataset_name,
      });
      if (foundDataset) {
        return res.status(400).send({
          success: false,
          message: "Bộ dữ liệu đã tồn tại",
        });
      }
      const dataset = await Dataset.create(value);
      if (dataset) {
        const exts = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
        if (!fs.existsSync(dataset.dataset_path)) return [];
        const images = await fs
          .readdirSync(dataset.dataset_path)
          .filter((file) => exts.includes(path.extname(file).toLowerCase()))
          .map((file) => path.join(dataset.dataset_path, file));
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const gallery = await Gallery.create({
            dataset_id: dataset._id,
            image_name: path.basename(image),
          });
        }
        addLichSuHoatDong(
          req.user._id,
          `Thêm mới bộ dữ liệu ${dataset.dataset_name}`
        );
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
        addLichSuHoatDong(
          req.user._id,
          `Xoá bộ dữ liệu ${dataset.dataset_name}`
        );
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
      console.log("Update dataset with ID:", id);
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
        addLichSuHoatDong(
          req.user._id,
          `Chỉnh sửa bộ dữ liệu ${dataset.dataset_name}`
        );
      }
      return res.json(dataset);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async downloadAnnotation(req, res) {
    try {
      const { id } = req.params;
      const dataset = await Dataset.findById(id);
      if (!dataset) {
        return responseAction.error(res, 404, "Bộ dữ liệu không tồn tại");
      }
      const query = {
        have_caption: true,
        dataset_id: mongoose.Types.ObjectId(id),
      };
      const images = await Gallery.find(query);

      const data = {
        info: {
          dataset: dataset.dataset_name,
        },
        images: [],
        annotations: [],
      };

      for (const item of images) {
        let { image_name, image_caption } = item;
        const name = image_name.replace(/\\/g, "/");
        const caption = image_caption;

        if (!caption || caption.length === 0) continue;
        // Assuming your images folder is in the same directory as this script
        // const imagePath = path.join("uploads", folderName, name);
        const imagePath = path
          .join(__dirname, "..", "..", "..", "..", dataset.dataset_path, name)
          .replace(/\\/g, "/");

        if (!fs.existsSync(imagePath)) {
          return responseAction.error(res, 404, "Tệp chú thích không tồn tại");
        }

        // Get image information (width and height)
        const dimensions = await new Promise((resolve, reject) => {
          sizeOf(imagePath, (err, dimensions) => {
            if (err) reject(err);
            else resolve(dimensions);
          });
        });

        const id = generateImageId(name);
        let fileName = name.split(/\\/g).pop();
        data.images.push({
          id,
          width: dimensions.width,
          height: dimensions.height,
          file_name: fileName,
          coco_url: fileName,
        });

        (caption || []).forEach((value) => {
          const { caption, segment } = value;
          // if (bbox.length > 0) {
          //   // If bbox exists, push annotation objects with bbox
          //   bbox.forEach((bboxItem, bboxIndex) => {
          //     data.annotations.push({
          //       id: data.annotations.length + 1,
          //       image_id: id, // ID of the last added image
          //       bbox: bboxItem,
          //       caption: caption.caption,
          //       segment_caption: caption.segment_caption,
          //     });
          //   });
          // } else {
          // If bbox doesn't exist, push annotation objects without bbox

          data.annotations.push({
            id: data.annotations.length + 1,
            image_id: id, // ID of the last added image
            caption: caption.replace(/\s+/g, " ").trim(),
            segment: segment.replace(/\s+/g, " ").trim(),
          });
          // }
        });
      }

      // Check if the 'output' folder exists, if not, create it
      const outputFolderPath = path.join(
        path.resolve(__dirname, "../../.."),
        "output"
      );
      if (!fs.existsSync(outputFolderPath)) {
        fs.mkdirSync(outputFolderPath);
      }

      // Write JSON object to file in the 'output' folder
      const jsonFilePath = path.join(
        outputFolderPath,
        `${dataset.dataset_name}.json`
      );

      fs.writeFile(jsonFilePath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
          console.error("❌ Lỗi ghi file JSON:", err);
          return res
            .status(500)
            .json({ success: false, message: "Lỗi ghi file JSON" });
        }

        res.download(jsonFilePath);
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
};

function generateImageId(imageName) {
  let hash = 0;
  for (let i = 0; i < imageName.length; i++) {
    hash = (hash << 5) - hash + imageName.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
