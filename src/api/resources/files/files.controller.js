import path from "path";
import File from "./file.model";
import { get } from "request";

export default {
  findFileById(req, res) {
    let { id } = req.params;
    return res.sendFile(path.join(process.cwd(), "./uploads/files/" + id));
  },
  async create(req, res) {
    try {
      let value = req.body;
      if (!value || !value.file_path) {
        return res.status(400).json({
          success: false,
          message: "No file data provided.",
        });
      }

      const file = await File.create({
        file_path: value.file_path,
      });

      if (file) {
        const newest = await File.findOne({ is_deleted: false }).sort({
          created_at: -1,
        });

        if (!newest) {
          return res.status(404).json({
            success: false,
            message: "No files found.",
          });
        }

        await File.updateMany(
          {
            _id: { $ne: newest._id },
            is_deleted: false,
          },
          { $set: { is_deleted: true } }
        );
      }

      return res.json(file);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  async getDocument(req, res) {
    const file = await File.findOne({
      is_deleted: false,
    });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "No document found.",
      });
    }
    return res.json(file);
  },
};
