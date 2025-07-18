import axios from "axios";
import FormData from "form-data";
import fs from "fs/promises"; // Use promise-based fs
import { createReadStream } from "fs"; // Standard fs for streaming
import path from "path";
import sharp from "sharp";
import { filterRequest, optionsRequest } from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Gallery from "./gallery.model";
import galleryService from "./gallery.service";
import User from "../user/user.model";
import Label from "../label/label.model";
import { addLichSuHoatDong } from "../../utils/lichsuhoatdong";

import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const imageLocks = new Map();

async function withLock(imagePath, operation, timeout = 10000) {
  const start = Date.now();
  while (imageLocks.get(imagePath)) {
    if (Date.now() - start > timeout) {
      throw new Error(`Lock timeout for ${imagePath}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait if locked
  }
  imageLocks.set(imagePath, true);
  try {
    return await operation();
  } finally {
    imageLocks.delete(imagePath); // Release lock
  }
}

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
      options.sort = { image_index: 1 };
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
  async findAllUndeletedDatasetImages(req, res) {
    try {
      console.log("Starting findAllUndeletedDatasetImages", {
        query: req.query,
        timestamp: new Date().toISOString(),
      });

      const query = filterRequest(req.query, true);

      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: "datasets",
            as: "dataset",
            let: { datasetId: "$dataset_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$datasetId"] },
                  is_deleted: { $ne: true },
                },
              },
            ],
          },
        },
        { $unwind: { path: "$dataset", preserveNullAndEmptyArrays: true } },
        { $count: "totalImages" },
      ];

      console.time("findAllUndeletedDatasetImagesQuery");
      const result = await Gallery.aggregate(pipeline).option({ lean: true });
      console.timeEnd("findAllUndeletedDatasetImagesQuery");

      const totalImages = result[0]?.totalImages || 0;

      console.log("Query completed", {
        totalImages,
        timestamp: new Date().toISOString(),
      });
      return res.json({ totalImages });
    } catch (err) {
      console.error("Error in findAllUndeletedDatasetImages:", {
        error: err.message,
        stack: err.stack,
      });
      return responseAction.error(res, 500, "Internal server error");
    }
  },
  async findAllCaptions(req, res) {
    try {
      const query = filterRequest(req.query, true);

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
        {
          $lookup: {
            from: "datasets",
            as: "dataset",
            let: { datasetId: "$dataset_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$datasetId"] },
                  is_deleted: false,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$dataset", preserveNullAndEmptyArrays: true } },
        { $count: "totalCaptionedImages" },
      ];

      const result = await Gallery.aggregate(pipeline).option({ lean: true });

      const totalCaptionedImages = result[0]?.totalCaptionedImages || 0;

      return res.json({ totalCaptionedImages });
    } catch (err) {
      console.error("Error in findAllCaptions:", {
        error: err.message,
        stack: err.stack,
      });
      return responseAction.error(res, 500, "Internal server error");
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

      const gallery = await Gallery.findById(id).populate({
        path: "dataset_id",
        select: "dataset_name dataset_path",
      });
      if (!gallery) {
        return responseAction.error(res, 404, "Gallery not found");
      }
      const FileName = gallery.image_name;
      const PathFolder = gallery.dataset_id.dataset_path;
      const imagePath = path
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

      try {
        await fs.access(imagePath, fs.constants.R_OK | fs.constants.W_OK);
      } catch (err) {
        console.error("File access error:", {
          path: imagePath,
          error: err.message,
        });
        return responseAction.error(
          res,
          404,
          `File not found or inaccessible: ${imagePath}`
        );
      }

      const formData = new FormData();
      formData.append("file", createReadStream(imagePath));
      await axios
        .post("http://127.0.0.1:5001/v1/api/detection", formData, {
          // .post("https://icai.ailabs.io.vn/v1/api/detection", formData, {
          headers: {
            ...formData.getHeaders(),
          },
        })
        .then(async (response) => {
          const {
            width: image_width,
            height: image_height,
            bboxes: boxes,
            dectect_path,
          } = response.data;
          const image_boxes = await Promise.all(
            boxes.map(async (box) => {
              const detected_label = await Label.findOne({
                label_name: box.class_name,
              });
              return {
                box: box.box,
                label_id: detected_label?._id,
                label_color: detected_label?.label_color,
                label_name: box.class_name,
              };
            })
          );
          const detected_image = dectect_path
            .replace(/\\/g, "/")
            .split("/")
            .pop();
          const gallery = await Gallery.findOneAndUpdate(
            { _id: id },
            {
              image_detection: detected_image,
              image_bbox: image_boxes,
              image_width: image_width,
              image_height: image_height,
              have_bbox: true,
            },
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
          console.error(`Lỗi upload: ${imagePath}`, error.message);
          res.status(500).json({ error: error.message });
        });
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async rotateImageCounterclockwise(req, res) {
    try {
      const { id } = req.params;
      const { angle = 90 } = req.body; // default 90 degrees

      const gallery = await Gallery.findById(id).populate({
        path: "dataset_id",
        select: "dataset_name dataset_path",
      });
      if (!gallery) {
        return responseAction.error(res, 404, "Gallery not found");
      }
      const FileName = gallery.image_name;
      const PathFolder = gallery.dataset_id.dataset_path;
      const imagePath = path
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

      try {
        await fs.access(imagePath, fs.constants.R_OK | fs.constants.W_OK);
        console.log("File is accessible:", imagePath);
      } catch (err) {
        console.error("File access error:", {
          path: imagePath,
          error: err.message,
        });
        return responseAction.error(
          res,
          404,
          `File not found or inaccessible: ${fileName}`
        );
      }

      // Rotate image
      const rotateAngle = -Math.abs(Number(angle)); // Counterclockwise
      try {
        const response = await axios.post(
          "https://icai.ailabs.io.vn/v1/api/rotate",
          {
            file_path: imagePath,
            angle: rotateAngle,
          }
        );
        console.log("Python API response:", response.data);
      } catch (err) {
        console.error("Python API error:", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        return responseAction.error(
          res,
          err.response?.status || 500,
          err.response?.data?.detail || "Failed to rotate image via Python API"
        );
      }

      return res.json(gallery);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async rotateImageClockwise(req, res) {
    try {
      const { id } = req.params;
      const { angle = 90 } = req.body; // default 90 degrees

      const gallery = await Gallery.findById(id).populate({
        path: "dataset_id",
        select: "dataset_name dataset_path",
      });
      if (!gallery) {
        return responseAction.error(res, 404, "Gallery not found");
      }
      const FileName = gallery.image_name;
      const PathFolder = gallery.dataset_id.dataset_path;
      const imagePath = path
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

      try {
        await fs.access(imagePath, fs.constants.R_OK | fs.constants.W_OK);
      } catch (err) {
        console.error("File access error:", {
          path: imagePath,
          error: err.message,
        });
        return responseAction.error(
          res,
          404,
          `File not found or inaccessible: ${fileName}`
        );
      }

      const rotateAngle = Math.abs(Number(angle)); // positive for clockwise
      try {
        const response = await axios.post(
          "https://icai.ailabs.io.vn/v1/api/rotate",
          {
            file_path: imagePath,
            angle: rotateAngle,
          }
        );
        console.log("Python API response:", response.data);
      } catch (err) {
        console.error("Python API error:", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        return responseAction.error(
          res,
          err.response?.status || 500,
          err.response?.data?.detail || "Failed to rotate image via Python API"
        );
      }

      return res.json(gallery);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async generateSegmentCaptions(req, res) {
    try {
      const { captions } = req.body;
      if (!captions || !Array.isArray(captions)) {
        return res.status(400).json({
          error: "Captions must be an array of strings.",
        });
      }

      const segment_arr = await axios
        .post(
          "https://icai.ailabs.io.vn/v1/api/caption2segment",
          { captions: captions },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => response.data.segment)
        .catch((error) => {
          console.error("Error segmenting captions:", error);
          return res.status(500).json({ error: "Error segmenting captions." });
        });

      return res.json({
        captions: captions,
        segment: segment_arr,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
};
