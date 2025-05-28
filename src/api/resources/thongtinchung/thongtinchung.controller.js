import ThongTinChung from './thongtinchung.model';
import * as responseAction from '../../utils/responseAction';
import {filterRequest} from '../../utils/filterRequest';
import DeviceToken from './devicetoken.model';

import { saveLichSuHoatDong } from '../../utils/lichsuhoatdong';

export default {
  async create(req, res) {
    try {
      const data = await ThongTinChung.create(req.body);
      return res.json(data);
    } catch (error) {
      responseAction.error(res, 500, error.errors);
    }
  },
  async findOne(req, res) {
    try {
      let {device_token} = req.query;
      if (device_token) {
        // kiểm tra xem, devicetoken đã tồn tại chưa.
        let device = await DeviceToken.findOne({device_token: device_token});
        // nếu chưa có thì add thêm mới.
        if (!device) {
          DeviceToken.create({device_token: device_token})
        }
      }

      let query = filterRequest(req.query, false)
      const data = await ThongTinChung.findOne(query);
      return res.json(data);
    } catch (err) {
      return res.status(500).send(err);
    }
  },
  async findAll(req, res) {
    try {
      let {device_token} = req.query;
      if (device_token) {
        // kiểm tra xem, devicetoken đã tồn tại chưa.
        let device = await DeviceToken.findOne({device_token: device_token});
        // nếu chưa có thì add thêm mới.
        if (!device) {
          DeviceToken.create({device_token: device_token})
        }
      }

      const data = await ThongTinChung.findOne();
      return res.json(data);
    } catch (err) {
      return res.status(500).send(err);
    }
  },
  async delete(req, res) {
    try {
      const id = req.params;
      const data = await ThongTinChung.findByIdAndDelete(id);
      if (!data) {
        responseAction.error(res, 404, '')
      }
      return res.json(data);
    } catch (err) {
      return res.status(500).send(err);
    }
  },
  async update(req, res) {
    try {
      const {id} = req.params;
      const data = await ThongTinChung.findByIdAndUpdate(id, req.body, {new: true});
      if (!data) {
        responseAction.error(res, 404, '')
      }

      if(data){
        saveLichSuHoatDong(req.user._id, 1, data, 'thong-tin-chung')
      }
      return res.json(data);
    } catch (err) {
      console.log(err, 'errerr')
      responseAction.error(res, 500, err.errors)
    }
  },
}