import { filterRequest, optionsRequest } from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Label from "./label.model";
import labelService from "./label.service";
import { addLichSuHoatDong } from "../../utils/lichsuhoatdong";
import xlsx from "xlsx";
import fs from "fs";
import { getConfig } from "../../../config/config";

const config = getConfig(process.env.NODE_ENV);

export default {
  async create(req, res) {
    try {
      const { value, error } = labelService.validateCreate(req.body, "POST");
      if (error) {
        return res.status(400).json(error.details);
      }
      const foundLabel = await Label.findOne({
        label_name: value.label_name,
      });
      if (foundLabel) {
        return res.status(400).send({
          success: false,
          message: "Nhãn đã tồn tại",
        });
      }
      const label = await Label.create(value);

      addLichSuHoatDong(req.user._id, `Thêm mới nhãn ${label.label_name}`);

      return res.json(label);
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
      options.sort = {
        created_at: 1,
      };
      const labels = await Label.paginate(query, options);
      return res.json(labels);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async findOne(req, res) {
    try {
      const { id } = req.params;
      const label = await Label.findById(id).populate({
        path: "annotator_id",
        select: "user_full_name user_email",
      });
      if (!label) {
        responseAction.error(res, 404, "");
      }
      return res.json(label);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const label = await Label.findOneAndUpdate(
        { _id: id },
        { is_deleted: true },
        { new: true }
      );
      if (!label) {
        responseAction.error(res, 404, "");
      }
      if (label) {
        addLichSuHoatDong(req.user._id, `Xoá nhãn ${label.label_name}`);
      }
      return res.json(label);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async update(req, res) {
    try {
      const { id } = req.params;
      const { value, error } = labelService.validateCreate(req.body, "PUT");
      if (error && error.details) {
        return responseAction.error(res, 400, error.details[0]);
      }

      const label = await Label.findOneAndUpdate({ _id: id }, value, {
        new: true,
      });

      if (!label) {
        responseAction.error(res, 404, "");
      }

      if (label) {
        if (value.annotator_id) {
          const createdLabel = await Label.findById(label._id).populate({
            path: "annotator_id",
            select: "user_full_name user_email",
          });
        }
        addLichSuHoatDong(req.user._id, `Chỉnh sửa nhãn ${label.label_name}`);
      }
      return res.json(label);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async createLabelByExcel(req, res) {
    try {
      const filePath = req.file.path;

      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet);

      for (const row of rows) {
        const labelColor = getRandomColor();
        const existingLabel = await Label.findOne({
          label_name: row.label_name,
        });
        if (!existingLabel) {
          const label = await Label.create({
            label_name: row.label_name,
            label_color: labelColor,
          });
        } else {
          const updatedLabel = await Label.findOneAndUpdate(
            { _id: existingLabel._id },
            {
              label_name: row.label_name || existingLabel.label_name,
              label_color:
                row.label_color || existingLabel.label_color || labelColor,
              label_vietnamese:
                row.label_vietnamese || existingLabel.label_vietnamese,
            },
            { new: true }
          );
        }
      }

      return res.json({
        success: true,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

function getRandomColor() {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
}
