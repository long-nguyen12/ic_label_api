import * as responseAction from '../../utils/responseAction';
import {filterRequest, optionsRequest} from '../../utils/filterRequest';
import LichSuHoatDong from './lichsuhoatdong.model'
// import { getTieuDe_DoiTuong } from '../../utils/lichsuhoatdong';

export default {
  async getAll(req, res) {
    try {
      let query = filterRequest(req.query)
      let options = optionsRequest(req.query)
      if(req.query.limit && req.query.limit === '0'){
        options.pagination = false;
      }
      options.populate=[{path: 'user_id',select:'full_name'}]
      let data = await LichSuHoatDong.paginate(query, options)

      // let dataRes = await getTieuDe_DoiTuong(data.docs)

      // data.docs = dataRes

      return res.json(data);
    } catch (err) {
      console.log(err);
      responseAction.error(res, 500, err.errors)
    }
  },

  async create(req, res){
    try {
      const data = await LichSuHoatDong.create(req.body);
      return res.json(data);
    } catch (err) {
      console.log(err);
      responseAction.error(res, 500, err.errors)
    }
  },

  async delete(req, res){
    try {
      const data = await LichSuHoatDong.remove();
      return res.json(data);
    } catch (err) {
      console.log(err);
      responseAction.error(res, 500, err.errors)
    }
  },
}