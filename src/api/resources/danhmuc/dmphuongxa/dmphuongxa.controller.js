import DmPhuongXa from './dmphuongxa.model';
import * as responseAction from '../../../utils/responseAction'
import {filterRequest, optionsRequest} from '../../../utils/filterRequest'
import exelUtils from "../../../utils/exelUtils";

export default {
  async create(req, res) {
    try {
      const data = await DmPhuongXa.create(req.body);
      return res.json(data);
    } catch (err) {
      responseAction.error(res, 500, err.errors)
    }
  },
  async findAll(req, res) {
    try {
      let query = filterRequest(req.query, true)
      let options = optionsRequest(req.query)
      options.select = '-is_deleted';
      options.sort = {matt: 1, maqh: 1, _id: 1}
      if(req.query.limit && req.query.limit === '0'){
        options.pagination = false;
      }
      options.populate=[{path: 'maqh',select:'tenhuyen'}, {path: 'matt',select:'tentinh'}]
      const data = await DmPhuongXa.paginate(query, options)
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async findOne(req, res) {
    try {
      const { id } = req.params;
      const data = await DmPhuongXa.findOne({is_deleted: false, _id: id});
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
      const { id } = req.params;
      const data = await DmPhuongXa.findOneAndUpdate({ _id: id }, {is_deleted: true}, { new: true });
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
      const { id } = req.params;
      const data = await DmPhuongXa.findOneAndUpdate({ _id: id }, req.body, { new: true });
      if (!data) {
          responseAction.error(res, 404, '')
      }
      return res.json(data);
    } catch (err) {
      console.error(err);
      responseAction.error(res, 500, err.errors)
    }
  },
  async import(req, res) {
    try {
      const Headers = {
        PROVINCE_CODE: "Mã tỉnh",
        DISTRICT_CODE: "Mã huyện",
        CODE: "Mã xã",
        NAME: "Tên xã",
      };
      const userInfo = req.userInfo;
      let filePath = req.files.file.path;
      const sheetData = await exelUtils.transformFile(filePath);
      let values = await sheetData[0].rows;
      let listPhuongXa = [];
      // kiểm tra mẫu file và file null
      for (let i = 0; i < values.length; i++) {
        if (values[i][Headers.PROVINCE_CODE] == undefined && values[i][Headers.DISTRICT_CODE] == undefined && values[i][Headers.CODE] == undefined && values[i][Headers.NAME] == undefined) {
          return res.status(404).send({message: 'File tải lên không đúng mẫu.'});
        }
      }
      if (!values.length) {
        return res.status(404).send({message: 'File tải lên không có dữ liệu.'});
      }
      // Đọc dữ liệu từng row
      values.forEach((row) => {
        const item = {
          matt: row[Headers.PROVINCE_CODE],
          maqh: row[Headers.DISTRICT_CODE],
          _id: row[Headers.CODE],
          tenxa: row[Headers.NAME],
        };
        listPhuongXa = [...listPhuongXa, item]
      });

      for (let i = 0; i < listPhuongXa.length; i += 100) {
        let data_import = listPhuongXa.slice(i, i + 100).map((item) => {
          DmPhuongXa.create(item)
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
