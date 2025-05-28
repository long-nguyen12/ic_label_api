import jwt from 'jsonwebtoken';
import { getConfig } from '../../config/config';

const config = getConfig(process.env.NODE_ENV);

export default function (req, res, next) {
  let token = req.query.token || req.headers['token'];
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, config.secret, function (err, decoded) {
      if (err) {
        if(err.message === 'jwt expired'){
          return res.json({Code: "1", Msg: "Phiên đăng nhập hết hạn,vui lòng đăng nhập lại.", Ext: ""});
        }
        return res.json({Code: "1", Msg: "Có lỗi quá đồng bộ dữ liệu.", Ext: ""});
      } else {
        next();
      }
    });
  } else {
    return res.json({Code: "1", Msg: "Có lỗi quá đồng bộ dữ liệu.", Ext: ""});
  }

}
