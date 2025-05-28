import DmTinhThanh from './dmtinhthanh.model';
import QuanHuyen from '../dmquanhuyen/dmquanhuyen.model';
import PhuongXa from '../dmphuongxa/dmphuongxa.model';

import * as responseAction from '../../../utils/responseAction'
import {filterRequest, optionsRequest} from '../../../utils/filterRequest'
import exelUtils from "../../../utils/exelUtils";
import {sendSMS} from "../../../utils/sms";

export default {
  async create(req, res) {
    try {
      const data = await DmTinhThanh.create(req.body);
      return res.json(data);
    } catch (err) {
      console.log(err);
      responseAction.error(res, 500, err.errors)
    }
  },
  async findAll(req, res) {
    try {
      let query = filterRequest(req.query, true);
      let options = optionsRequest(req.query)
      options.select = '-is_deleted';
      options.sort = {_id: 1}
      if (req.query.limit && req.query.limit === '0') {
        options.pagination = false;
      }
      const data = await DmTinhThanh.paginate(query, options)
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async findOne(req, res) {
    try {
      const {id} = req.params;
      const data = await DmTinhThanh.findOne({is_deleted: false, _id: id});
      if (!data) {
        responseAction.error(res, 404, '')
      }
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async delete(req, res) {
    try {
      const {id} = req.params;
      const checkQH = await QuanHuyen.findOne({matt: id})
      const checkPX = await PhuongXa.findOne({matt: id})
      if (checkQH || checkPX) return res.status(404).send({message: 'Không thể xóa tỉnh/thành đã được sử dụng'});
      const data = await DmTinhThanh.findOneAndUpdate({_id: id}, {is_deleted: true}, {new: true});
      if (!data) {
        responseAction.error(res, 404, '')
      }
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async update(req, res) {
    try {
      const {id} = req.params;
      const data = await DmTinhThanh.findOneAndUpdate({_id: id}, req.body, {new: true});
      if (!data) {
        responseAction.error(res, 404, '')
      }
      return res.json(data);
    } catch (err) {
      console.error(err);
      responseAction.error(res, 500, err.errors)
    }
  },

  async dsQuanHuyenByTinh(req, res) {
    const {id} = req.params;
    let district = await QuanHuyen.find({matt: id}).sort({name: 1});
    return res.json(district)
  },

  async import(req, res) {
    try {
      const Headers = {
        CODE: "Mã tỉnh",
        NAME: "Tên tỉnh",
      };
      const userInfo = req.userInfo;
      let filePath = req.files.file.path;
      const sheetData = await exelUtils.transformFile(filePath);
      let values = await sheetData[0].rows;
      let listTinhThanh = [];
      // kiểm tra mẫu file và file null
      for (let i = 0; i < values.length; i++) {
        if (values[i][Headers.CODE] == undefined && values[i][Headers.NAME] == undefined) {
          return res.status(404).send({message: 'File tải lên không đúng mẫu.'});
        }
      }
      if (!values.length) {
        return res.status(404).send({message: 'File tải lên không có dữ liệu.'});
      }
      // Đọc dữ liệu từng row
      values.forEach((row) => {
        const item = {
          _id: row[Headers.CODE],
          tentinh: row[Headers.NAME],
        };
        listTinhThanh = [...listTinhThanh, item]
      });

      for (let i = 0; i < listTinhThanh.length; i += 100) {
        let data_import = listTinhThanh.slice(i, i + 100).map((item) => {
          DmTinhThanh.create(item)
        })
        if (data_import.length) {
          await Promise.all(data_import)
        }
      }
      // Xóa file excel ở bộ nhớ tạm
      var fs = require("fs");
      fs.unlink(filePath, function (err) {
        if (err) throw err;
      });
      return res.json({success: true});
    } catch (err) {
      console.log(err);
      responseAction.error(res, 500, err.errors)
    }
  }
};
