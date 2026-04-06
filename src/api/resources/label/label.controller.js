import { filterRequest, optionsRequest } from "../../utils/filterRequest";
import * as responseAction from "../../utils/responseAction";
import Label from "./label.model";
import labelService from "./label.service";
import { addLichSuHoatDong } from "../../utils/lichsuhoatdong";
import xlsx from "xlsx";
import fs from "fs";

export default {
  async create(req, res) {
    try {
      const { value, error } = labelService.validateCreate(req.body, "POST");
      if (error) {
        return res.status(400).json(error.details);
      }

      const foundLabel = await Label.findOne({
        label_name: value.label_name,
        is_deleted: false,
      });
      if (foundLabel) {
        return res.status(400).send({
          success: false,
          message: "Label already exists",
        });
      }

      const label = await Label.create(value);
      addLichSuHoatDong(req.user._id, `Create label ${label.label_name}`);
      return res.json(label);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async findAll(req, res) {
    try {
      const reqQuery = {
        ...req.query,
      };
      const query = filterRequest(reqQuery, true);
      const options = optionsRequest(reqQuery);

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
      const label = await Label.findOne({
        _id: id,
        is_deleted: false,
      });

      if (!label) {
        return responseAction.error(res, 404, "");
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
        { _id: id, is_deleted: false },
        { is_deleted: true },
        { new: true }
      );

      if (!label) {
        return responseAction.error(res, 404, "");
      }

      addLichSuHoatDong(req.user._id, `Delete label ${label.label_name}`);
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

      if (value.label_name) {
        const duplicateLabel = await Label.findOne({
          _id: { $ne: id },
          label_name: value.label_name,
          is_deleted: false,
        });
        if (duplicateLabel) {
          return res.status(400).send({
            success: false,
            message: "Label already exists",
          });
        }
      }

      const label = await Label.findOneAndUpdate(
        { _id: id, is_deleted: false },
        value,
        {
          new: true,
        }
      );

      if (!label) {
        return responseAction.error(res, 404, "");
      }

      addLichSuHoatDong(req.user._id, `Update label ${label.label_name}`);
      return res.json(label);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async createLabelByExcel(req, res) {
    let filePath = "";

    try {
      if (!req.file || !req.file.path) {
        return responseAction.error(res, 400, {
          message: "File upload is required",
        });
      }

      filePath = req.file.path;
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet);

      for (const row of rows) {
        const labelName = String(row.label_name || row.labelName || "").trim();
        if (!labelName) {
          continue;
        }

        const labelColor =
          row.label_color || row.labelColor || getRandomColor();
        const labelVietnamese = row.label_vietnamese || row.labelVietnamese;

        const existingLabel = await Label.findOne({
          label_name: labelName,
        });

        if (!existingLabel) {
          await Label.create({
            label_name: labelName,
            label_color: labelColor,
            label_vietnamese: labelVietnamese,
          });
        } else {
          await Label.findOneAndUpdate(
            { _id: existingLabel._id },
            {
              label_name: labelName,
              label_color:
                labelColor || existingLabel.label_color || getRandomColor(),
              label_vietnamese:
                labelVietnamese || existingLabel.label_vietnamese,
              is_deleted: false,
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
    } finally {
      if (filePath) {
        fs.unlink(filePath, () => {});
      }
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
