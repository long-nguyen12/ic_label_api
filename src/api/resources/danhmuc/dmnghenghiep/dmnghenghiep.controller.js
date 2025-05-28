import DmNgheNghiep from './dmnghenghiep.model';
import * as responseAction from '../../../utils/responseAction'
import {filterRequest, optionsRequest} from '../../../utils/filterRequest'

export default {
  async create(req, res) {
    try {
      const data = await DmNgheNghiep.create(req.body);
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
      const data = await DmNgheNghiep.paginate(query, options)
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },


  async findOne(req, res) {
    try {
      const { id } = req.params;
      const data = await DmNgheNghiep.findOne({is_deleted: false, _id: id});
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
      const data = await DmNgheNghiep.findOneAndUpdate({ _id: id }, {is_deleted: true}, { new: true });
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
      const data = await DmNgheNghiep.findOneAndUpdate({ _id: id }, req.body, { new: true });
      if (!data) {
          responseAction.error(res, 404, '')
      }
      return res.json(data);
    } catch (err) {
      console.error(err);
      responseAction.error(res, 500, err.errors)
    }
  },
};
