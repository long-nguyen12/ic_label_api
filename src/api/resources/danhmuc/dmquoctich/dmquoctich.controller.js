import DmQuocTich from './dmquoctich.model';
import * as responseAction from '../../../utils/responseAction'
import {filterRequest, optionsRequest} from '../../../utils/filterRequest'

export default {
  async create(req, res) {
    try {
      const dataMax = await DmQuocTich.find().sort({_id: -1}).limit(1);
      const dataSave = {
        _id: dataMax[0]._id + 1,
        tenquoctich: req.body.tenquoctich
      };
      //Check quốc tịch đã tồn tại chưa
      const duplicate = await DmQuocTich.findOne({is_deleted: false, tenquoctich: dataSave.tenquoctich});
      if(duplicate) return res.status(400).json({success: false, message: 'Trùng với quốc tịch đã tồn tại.'});

      const data = await DmQuocTich.create(dataSave);
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

      const data = await DmQuocTich.paginate(query, options)
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },


  async findOne(req, res) {
    try {
      const { id } = req.params;
      const data = await DmQuocTich.findOne({is_deleted: false, _id: id});
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
      const data = await DmQuocTich.findOneAndUpdate({ _id: id }, {is_deleted: true}, { new: true });
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
      //Check quốc tịch đã tồn tại chưa
      const duplicate = await DmQuocTich.findOne({is_deleted: false, tenquoctich: req.body.tenquoctich, _id: {$ne: id}});
      if (duplicate) return res.status(400).json({success: false, message: 'Trùng với quốc tịch đã tồn tại.'});

      const data = await DmQuocTich.findOneAndUpdate({_id: id}, req.body, {new: true});
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
