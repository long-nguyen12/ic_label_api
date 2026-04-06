import { getConfig } from '../../config/config';
const config = getConfig(process.env.NODE_ENV);

export default function (req, res, next) {
  let username = req.headers['username'];
  let password = req.headers['password'];
  let api_sync_valid = config.api_sync_valid;

  if (!api_sync_valid || !api_sync_valid.username || !api_sync_valid.password) {
    return res.status(500).json({
      Code: "1",
      Msg: "API sync credentials are not configured",
      Ext: "",
    });
  }

  if(api_sync_valid.username === username && api_sync_valid.password === password ){
    next();
  }else{
    return res.json({Code: "1", Msg: 'Lỗi xác thực tài khoản', Ext: ""});
  }

}
