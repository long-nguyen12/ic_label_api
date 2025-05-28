export function error(res, code = 400, messageErr) {
  let response = {
    success: false,
    message: 'Có lỗi xảy ra, vui lòng liên hệ quản trị viên.'
  };
  if(code === 400 && messageErr && messageErr.message){
    response.message = messageErr.message
  }else if(code === 500 && messageErr && messageErr.code){
    response.message = messageErr.code.message
  }else if(code === 404){
      response.message = 'Dữ liệu không tồn tại, vui lòng kiểm tra và thử lại.'
  }else if(code === 401){
    response.message = 'Api không có token hoặc không đúng định dạng'
  }
  return res.status(code).json(response);
}