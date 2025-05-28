import { getConfig } from '../../config/config';
const config = getConfig(process.env.NODE_ENV);

export default function (req, res, next) {
  let username = req.headers['username'];
  let password = req.headers['password'];
  let api_key = req.headers['api_key'];
  let api_sync_valid = config.api_sync_valid;

  if(api_sync_valid.username === username && api_sync_valid.password === password ){
    next();
  }else{
    return res.json({Code: "1", Msg: 'Lỗi xác thực tài khoản', Ext: ""});
  }

}
