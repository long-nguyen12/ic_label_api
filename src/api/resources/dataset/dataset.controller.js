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
import Mailjet from "node-mailjet";

import { getConfig } from "../../../config/config";
import { sendEmail } from "../../utils/mailHelper";
const config = getConfig(process.env.NODE_ENV);

const mailjet = Mailjet.apiConnect(
  config.MAILJET_API_KEY,
  config.MAILJET_SECRET_KEY
);

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
            image_index: i,
            image_name: path.basename(image),
          });
        }

        const createdDataset = await Dataset.findById(dataset._id).populate({
          path: "annotator_id",
          select: "user_full_name user_email",
        });
        try {
          await mailjet.post("send", { version: "v3.1" }).request({
            Messages: [
              {
                From: {
                  Email: config.MAILER_AUTH_USER,
                  Name: "Hệ thống gán nhãn",
                },
                To: [
                  {
                    Email: createdDataset.annotator_id.user_email,
                    Name: createdDataset.annotator_id.full_name,
                  },
                ],
                Subject: "Phân công bộ dữ liệu mới",
                TextPart: `Bạn đã được phân công bộ dữ liệu "${dataset.dataset_name}". Vui lòng truy cập hệ thống để thực hiện gán nhãn.`,
                HTMLPart: `<p>Chào ${createdDataset.annotator_id.user_full_name},</p>
                          <p>Bạn đã được phân công bộ dữ liệu <strong>"${dataset.dataset_name}"</strong>.</p>
                          <p>Vui lòng truy cập hệ thống để thực hiện gán nhãn.</p>
                          <p>Trân trọng,</p>
                          <p>Hệ thống gán nhãn</p>`,
              },
            ],
          });
        } catch (emailError) {
          console.error("Error sending email:", emailError);
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
      const query = filterRequest(req.query, true);
      let options = optionsRequest(req.query);

      // Enforce pagination limits
      if (req.query.limit && req.query.limit === "0") {
        options.pagination = false;
      } else {
        options.limit = Math.min(options.limit || 10, 20);
      }

      const galleryFilter = { is_deleted: false };
      if (req.query.have_caption === "true") {
        galleryFilter.have_caption = true;
      }
      if (req.query.image_name) {
        galleryFilter.image_name = {
          $regex: req.query.image_name,
          $options: "i",
        };
      }
      if (req.query.have_bbox === "true") {
        galleryFilter.have_bbox = true;
      }

      const imageLimit = parseInt(req.query.image_limit, 10) || 10;

      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: "galleries",
            as: "images",
            let: { datasetId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$dataset_id", "$$datasetId"] },
                  ...galleryFilter,
                },
              },
              { $sort: { image_index: 1 } },
              { $limit: imageLimit },
              {
                $project: {
                  _id: 1,
                  image_name: 1,
                  image_caption: 1,
                  image_index: 1,
                  have_caption: 1,
                  have_bbox: 1,
                  dataset_id: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "galleries",
            as: "imageCounts",
            let: { datasetId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$dataset_id", "$$datasetId"] },
                  is_deleted: false,
                },
              },
              {
                $group: {
                  _id: null,
                  totalImages: { $sum: 1 },
                  captionedImages: {
                    $sum: { $cond: [{ $eq: ["$have_caption", true] }, 1, 0] },
                  },
                },
              },
              { $project: { _id: 0, totalImages: 1, captionedImages: 1 } },
            ],
          },
        },
        { $unwind: { path: "$imageCounts", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            as: "annotator_id",
            let: { annotatorId: "$annotator_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$annotatorId"] },
                },
              },
              { $project: { _id: 1, user_full_name: 1, user_email: 1 } },
            ],
          },
        },
        {
          $unwind: { path: "$annotator_id", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            _id: 1,
            dataset_name: 1,
            dataset_path: 1,
            dataset_note: 1,
            annotator_id: 1,
            is_deleted: 1,
            created_at: 1,
            updated_at: 1,
            images: 1,
            totalImages: { $ifNull: ["$imageCounts.totalImages", 0] },
            captioned_images: { $ifNull: ["$imageCounts.captionedImages", 0] },
          },
        },
      ];

      // Apply pagination
      if (options.pagination !== false) {
        pipeline.push(
          { $sort: options.sort || { created_at: -1 } },
          { $skip: (options.page - 1) * options.limit },
          { $limit: options.limit }
        );
      }

      let products = await Dataset.aggregate(pipeline).option({ lean: true });

      const totalDocs = await Dataset.countDocuments(query);
      products = {
        docs: products,
        totalDocs,
        limit: options.limit,
        page: options.page,
        totalPages:
          options.pagination !== false
            ? Math.ceil(totalDocs / options.limit)
            : 1,
        hasNextPage:
          options.pagination !== false &&
          options.page * options.limit < totalDocs,
        hasPrevPage: options.page > 1,
      };

      return res.json(products);
    } catch (err) {
      console.error("Error in findAll:", {
        error: err.message,
        stack: err.stack,
      });
      return responseAction.error(res, 500, "Internal server error");
    }
  },

  async findOne(req, res) {
    try {
      const { id } = req.params;
      const dataset = await Dataset.findById(id).populate({
        path: "annotator_id",
        select: "user_full_name user_email",
      });
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
        if (value.annotator_id) {
          const createdDataset = await Dataset.findById(dataset._id).populate({
            path: "annotator_id",
            select: "user_full_name user_email",
          });
          try {
            await mailjet.post("send", { version: "v3.1" }).request({
              Messages: [
                {
                  From: {
                    Email: config.MAILER_AUTH_USER,
                    Name: "Hệ thống gán nhãn",
                  },
                  To: [
                    {
                      Email: createdDataset.annotator_id.user_email,
                      Name: createdDataset.annotator_id.user_full_name,
                    },
                  ],
                  Subject: "Phân công bộ dữ liệu mới",
                  TextPart: `Bạn đã được phân công bộ dữ liệu "${dataset.dataset_name}". Vui lòng truy cập hệ thống để thực hiện gán nhãn.`,
                  HTMLPart: `<p>Chào ${createdDataset.annotator_id.user_full_name},</p>
                          <p>Bạn đã được phân công bộ dữ liệu <strong>"${dataset.dataset_name}"</strong>.</p>
                          <p>Vui lòng truy cập hệ thống để thực hiện gán nhãn.</p>
                          <p>Trân trọng,</p>
                          <p>Hệ thống gán nhãn</p>`,
                },
              ],
            });
          } catch (emailError) {
            console.error("Error sending email:", emailError);
          }
        }
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
        path.resolve(__dirname, "../../../.."),
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
