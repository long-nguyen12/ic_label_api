import PhanQuyenVaiTro from "./phanquyenvaitro.model";

import * as responseAction from "../../utils/responseAction";
import { filterRequest, optionsRequest } from "../../utils/filterRequest";

export default {
  async findAll(req, res) {
    try {
      let query = filterRequest(req.query, true);
      let options = optionsRequest(req.query);
      if (req.query.limit && req.query.limit === "0") {
        options.pagination = false;
      }
      options.lean = true;
      const data = await PhanQuyenVaiTro.paginate(query, options);
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async create(req, res) {
    try {
      const data = await PhanQuyenVaiTro.create(req.body);
      return res.json(data);
    } catch (err) {
      console.log(err, "errerr");
      return responseAction.error(res, 500, err.errors);
    }
  },

  async getOneById(req, res) {
    try {
      const { id } = req.params;
      const data = await PhanQuyenVaiTro.findById(id);
      if (!data) {
        return responseAction.error(res, 404, "");
      }
      return res.json(data);
    } catch (err) {
      console.error(err);
      return responseAction.error(res, 500, err.errors);
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await PhanQuyenVaiTro.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!data) {
        return responseAction.error(res, 404, "");
      }
      return res.json(data);
    } catch (err) {
      console.error(err);
      return responseAction.error(res, 500, err.errors);
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      // const data = await PhanQuyenVaiTro.findOneAndUpdate({ _id: id }, {is_deleted: true}, { new: true });
      const data = await PhanQuyenVaiTro.findByIdAndDelete(id);
      if (!data) {
        return responseAction.error(res, 404, "");
      }
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async postTrang(req, res) {
    try {
      const { id } = req.params;
      var phanquyenvaitro = await PhanQuyenVaiTro.findOne({
        is_deleted: false,
        _id: id,
      });
      req.body.map(async (item) => {
        await phanquyenvaitro.trang.push(item);
      });
      phanquyenvaitro.save();
      return res.json(phanquyenvaitro);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async putTrang(req, res) {
    try {
      const { id } = req.params;
      const id_PhanQuyenVaiTro = req.url.split("/")[1];
      var phanquyenvaitro = await PhanQuyenVaiTro.findOne({
        is_deleted: false,
        _id: id_PhanQuyenVaiTro,
      });
      let trang = await phanquyenvaitro.trang.id(id);
      trang.set({
        tentrang: req.body.tentrang,
        add: req.body.add,
        update: req.body.update,
        delete: req.body.delete,
        select: req.body.select,
      });

      await phanquyenvaitro.save();

      if (!trang) {
        return responseAction.error(res, 404, "");
      }

      return res.json(trang);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
};
