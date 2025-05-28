import DmDanToc from './dmdantoc.model';
import * as responseAction from '../../../utils/responseAction'
import {filterRequest, optionsRequest} from '../../../utils/filterRequest'
import exelUtils from "../../../utils/exelUtils";

export default {
  async create(req, res) {
    try {
      const data = await DmDanToc.create(req.body);
      return res.json(data);
    } catch (err) {
      responseAction.error(res, 500, err.errors)
    }
  },
  async findAll(req, res) {
    try {
      let query = filterRequest(req.query, true)
      
      let options = optionsRequest(req.query)
      if(req.query.limit && req.query.limit === '0'){
        options.pagination = false;
      }
      options.sort = {_id: 1}
      const data = await DmDanToc.paginate(query, options)
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },


  async findOne(req, res) {
    try {
      const { id } = req.params;
      const data = await DmDanToc.findOne({is_deleted: false, _id: id});
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
      const data = await DmDanToc.findOneAndUpdate({ _id: id }, {is_deleted: true}, { new: true });
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
      const data = await DmDanToc.findOneAndUpdate({ _id: id }, req.body, { new: true });
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
        CODE: "Mã dân tộc",
        NAME: "Tên dân tộc",
        OTHER_NAME: "Tên gọi khác",
      };
      const userInfo = req.userInfo;
      let filePath = req.files.file.path;
      const sheetData = await exelUtils.transformFile(filePath);
      let values = await sheetData[0].rows;
      let listDanToc = [];
      // kiểm tra mẫu file và file null
      for (let i = 0; i < values.length; i++) {
        if (values[i][Headers.OTHER_NAME] == undefined && values[i][Headers.CODE] == undefined && values[i][Headers.NAME] == undefined) {
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
          tendantoc: row[Headers.NAME],
          tengoikhac: row[Headers.OTHER_NAME],
        };
        listDanToc = [...listDanToc, item]
      });

      for (let i = 0; i < listDanToc.length; i += 100) {
        let data_import = listDanToc.slice(i, i + 100).map((item) => {
          DmDanToc.create(item)
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
