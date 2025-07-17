import axios from "axios";
import FormData from "form-data";
import fs from 'fs/promises'; // Use promise-based fs
import { createReadStream } from 'fs'; // Standard fs for streaming
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
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait if locked
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
      let req_query = {
        ...req.query,
      };
      let matchQuery = filterRequest(req_query, true);

      const pipeline = [
        { $match: matchQuery },
        {
          $lookup: {
            from: "datasets",
            localField: "dataset_id",
            foreignField: "_id",
            as: "dataset",
          },
        },
        { $unwind: "$dataset" },
        { $match: { "dataset.is_deleted": { $ne: true } } },
        {
          $project: {
            _id: 1,
            dataset_id: 1,
            image_index: 1,
            image_name: 1,
            image_caption: 1,
            image_bbox: 1,
            image_detection: 1,
            have_caption: 1,
            have_bbox: 1,
            created_at: 1,
            updated_at: 1,
            "dataset.dataset_name": 1,
            "dataset.dataset_path": 1,
          },
        },
        { $sort: { image_index: 1 } },
      ];

      const galleries = await Gallery.aggregate(pipeline);

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
        {
          $lookup: {
            from: "datasets",
            localField: "dataset_id",
            foreignField: "_id",
            as: "dataset",
          },
        },
        { $unwind: "$dataset" },
        { $match: { "dataset.is_deleted": false } },
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

      // if (!fs.existsSync(imagePath)) {
      //   return res.status(404).json({ error: `File not found: ${imagePath} ` });
      // }
      try {
        await fs.access(imagePath, fs.constants.R_OK | fs.constants.W_OK);
      } catch (err) {
        console.error('File access error:', { path: imagePath, error: err.message });
        return responseAction.error(res, 404, `File not found or inaccessible: ${fileName}`);
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
            boxes,
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
  async rotateImage(req, res) {
    try {
      const { id } = req.params;
      const { angle = 90 } = req.body;

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

      // if (!fs.existsSync(imagePath)) {
      //   return res.status(404).json({ error: `File not found: ${Path} ` });
      // }
      try {
        await fs.access(imagePath, fs.constants.R_OK | fs.constants.W_OK);
      } catch (err) {
        console.error('File access error:', { path: imagePath, error: err.message });
        return responseAction.error(res, 404, `File not found or inaccessible: ${fileName}`);
      }

      const tempPath = imagePath + ".rotated";
      await sharp(imagePath).rotate(Number(normalizedAngle)).toFile(tempPath);

      fs.renameSync(tempPath, imagePath);

      return res.json(gallery);
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
        console.log('File is accessible:', imagePath);
      } catch (err) {
        console.error('File access error:', { path: imagePath, error: err.message });
        return responseAction.error(res, 404, `File not found or inaccessible: ${fileName}`);
      }

      // Rotate image
      const rotateAngle = -Math.abs(Number(angle)); // Counterclockwise
      try {
        const response = await axios.post('https://icai.ailabs.io.vn/v1/api/rotate', {
          file_path: imagePath,
          angle: rotateAngle,
        });
        console.log('Python API response:', response.data);
      } catch (err) {
        console.error('Python API error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        return responseAction.error(res, err.response?.status || 500, err.response?.data?.detail || 'Failed to rotate image via Python API');
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

      // if (!fs.existsSync(imagePath)) {
      //   return res.status(404).json({ error: `File not found: ${imagePath}` });
      // }
      try {
        await fs.access(imagePath, fs.constants.R_OK | fs.constants.W_OK);
      } catch (err) {
        console.error('File access error:', { path: imagePath, error: err.message });
        return responseAction.error(res, 404, `File not found or inaccessible: ${fileName}`);
      }

      const rotateAngle = Math.abs(Number(angle)); // positive for clockwise
      try {
        const response = await axios.post('https://icai.ailabs.io.vn/v1/api/rotate', {
          file_path: imagePath,
          angle: rotateAngle,
        });
        console.log('Python API response:', response.data);
      } catch (err) {
        console.error('Python API error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        return responseAction.error(res, err.response?.status || 500, err.response?.data?.detail || 'Failed to rotate image via Python API');
      }

      return res.json(gallery);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async generateAICaptions(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findOne({ is_deleted: false, _id: req.user._id });

      const gallery = await Gallery.findById(id).populate({
        path: "dataset_id",
        select: "dataset_name dataset_path",
      });
      if (!gallery) {
        return responseAction.error(res, 404, "Gallery not found");
      }
      const FileName = gallery.image_name;
      const folder_path = gallery.dataset_id.dataset_path;
      const image_path = path
        .join(__dirname, "..", "..", "..", "..", folder_path, FileName)
        .replace(/\\/g, "/");
      const base64ImageFile = fs.readFileSync(image_path, {
        encoding: "base64",
      });

      const contents = [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64ImageFile,
          },
        },
        {
          text: `Sinh 5 captions bằng tiếng Việt cho bức ảnh trên. 
          Mỗi caption có độ dài từ 10-20 từ,
          chỉ nêu những đối tượng, hoạt động, bối cảnh, chi tiết đáng chú ý,
          các mô tả không sử dụng từ trừu tượng hoặc suy đoán.
          Đầu ra là 1 mảng các caption.`,
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents,
      });

      const captions = response.text;

      const match = captions.match(/\[[^\]]*\]/);
      if (!match) {
        return res.status(400).json({
          error: "Không sinh được caption cho ảnh này.",
        });
      }
      const arr = JSON.parse(match[0]);

      const segment_response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `sinh các segment words tiếng Việt cho các câu sau: ${arr}, 
          theo ví dụ cho câu: "Đường có nhiều xe máy đang dừng chờ đèn đỏ, ô tô phía trước", 
          kết quả: "Đường có nhiều xe_máy đang dừng chờ đèn_đỏ , ô_tô phía_trước".
          Đầu ra là 1 mảng các caption`,
          Đầu ra là chỉ bao gồm 1 mảng các caption`,
        config: {
          thinkingConfig: {
            thinkingBudget: 0, // Disables thinking
          },
        },
      });
      const segment_captions = segment_response.text;
      const segment_match = segment_captions.match(/\[[^\]]*\]/);

      if (!segment_match) {
        return res.status(400).json({
          error: "No valid captions found in the response.",
        });
      }
      const segment_arr = JSON.parse(segment_match[0]);

      return res.json({
        captions: arr,
        segment: segment_arr,
      });
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

      const segment_arr = await axios.post(
        "https://icai.ailabs.io.vn/v1/api/caption2segment",
        { captions: captions },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }).then(response => response.data.segment).catch(error => {
          console.error("Error segmenting captions:", error);
          return res.status(500).json({ error: "Error segmenting captions." });
        });

      return res.json({
        captions: captions,
        segment: segment_arr
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  }
};
