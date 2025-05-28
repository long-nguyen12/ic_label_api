import LichSuHoatDong, {ChiTietLichSuHistory} from '../resources/lichsuhoatdong/lichsuhoatdong.model';

const PAGE_LIST = {
  'danhmuc-tintuc': 'Danh mục tin tức',
  'tintuc': 'Tin tức',
  'hoidap': 'Hỏi đáp',
  'dang-ky-goi-dich-vu' : 'Đăng ký gói dịch vụ',
  'dmdichvu': 'Danh mục dịch vụ',
  'benhnhan': 'Bệnh nhân',
  'dmgia': 'Danh mục giá',
  'gia-dich-vu': 'Giá dịch vụ',
  'goi-dich-vu': 'Gói dịch vụ',
  'dmgoidichvu': 'Danh mục gói dịch vụ',
  'huongdankhambenh': 'Hướng dẫn',
  'dm-huongdankhambenh': 'Danh mục hướng dẫn',
  'dmhoidap': 'Danh mục hỏi đáp',
  'dmdanhgia': 'Danh mục đánh giá',
  'users': 'Người dùng',
  'cau-hoi-thuong-gap': 'Câu hỏi thường gặp',
  'thong-tin-chung': 'Thông tin chung',
  'thong-tin-ung-dung': 'Thông tin giới thiệu',
  'lich-hen': 'Lịch hẹn',
  'dmnhanvien': 'Quản lý nhân viên',
}

const CHILD_PAGE_LIST = {
  'goi-dich-vu': 'dịch vụ',
  'benhnhan_@1': 'mật khẩu',
  'benhnhan_@2': 'thông tin hành chính',
}

export const saveLichSuHoatDong = async (user_id, type, data, urltrang) => {
  let doituong_id = data._id
  let urltrangNew = urltrang
  if(urltrang.split("_@") && urltrang.split("_@")[1]){
    urltrang = urltrang.split("_@")[0];
  }
  let {tieude, url} = getTieuDe(data, urltrang)
  if(type === 4){
    tieude = CHILD_PAGE_LIST[urltrangNew] + ' của ' + tieude
    type = 2
  }
  try{
    let data_history = {
      user_id: user_id,
      thaotac: type,
      tentrang: PAGE_LIST[urltrang],
      urltrang: url,
      doituong_id: doituong_id,
      tieude: tieude
    }
    let lichsu = await LichSuHoatDong.create(data_history)
    if(type === 3){
      // Khi 2 đối tượng bị xoá sẽ update lại url của các đối tượng ấy mà thao tác là 1,2,5,6
      let lichsuhoatdong_update = await LichSuHoatDong.find({doituong_id: data._id})
      lichsuhoatdong_update.map(async e => {
        await LichSuHoatDong.findByIdAndUpdate(e._id, {urltrang: `/${e.urltrang.split("/")[1]}`})
      })
    }
    let datalichsu = {
      data: data,
      document_id: data._id,
      type: urltrang,
      user_id: user_id,
      lichsu_id: lichsu._id,
    }

    ChiTietLichSuHistory.create(datalichsu)
  }catch (err){
    console.log(err)
  }
};


function getTieuDe(data, urltrang){
  let tieude = ''
  let url = ''
  if(urltrang === 'danhmuc-tintuc'){
    tieude = "danh mục " + data.ten.toLowerCase()
    url = '/' + urltrang
  }else if(urltrang === 'tintuc'){
    tieude = 'tin tức ' + data.tieude.toLowerCase()
    url = '/' + urltrang + '/' + data._id
  }else if(urltrang === 'hoidap'){
    tieude = 'câu hỏi của bệnh nhân ' + data.mabn.hoten
    url = '/' + urltrang + '/' + data._id
  }else if(urltrang === 'dang-ky-goi-dich-vu'){
    tieude = 'gói dịch vụ ' + data.goidichvu_id.tengoi + ' của bệnh nhân ' + data.benhnhan_id.hoten
    url = '/' + urltrang + '/' + data._id
  }else if(urltrang === 'dmdichvu'){
    tieude = 'danh mục ' + data.tendichvu
    url = '/' + urltrang
  }else if(urltrang === 'benhnhan'){
    tieude = 'bệnh nhân ' + data.hoten + `(${data._id})`
    url = '/' + urltrang + '/' + data._id
  }else if(urltrang === 'dmgia'){
    tieude = 'danh mục ' + data.tendmgia
    url = '/' + urltrang
  }else if(urltrang === 'gia-dich-vu'){
    tieude = 'dịch vụ ' + data.tenhh
    url = '/' + urltrang
  }else if(urltrang === 'goi-dich-vu'){
    tieude = 'gói dịch vụ ' + data.tengoi
    url = '/' + urltrang + '/' + data._id
  }else if(urltrang === 'dmgoidichvu'){
    tieude = 'danh mục ' + data.tendmgoidv
    url = '/' + urltrang
  }else if(urltrang === 'huongdankhambenh'){
    tieude = 'hướng dẫn ' + data.tieude
    url = '/' + urltrang + '/' + data._id
  }else if(urltrang === 'dm-huongdankhambenh'){
    tieude = 'danh mục ' + data.ten
    url = '/' + urltrang
  }else if(urltrang === 'dmhoidap'){
    tieude = 'danh mục ' + data.tendm
    url = '/' + urltrang
  }else if(urltrang === 'dmdanhgia'){
    tieude = 'danh mục ' + data.tendanhgia
    url = '/' + urltrang
  }else if(urltrang === 'users'){
    tieude = data.full_name
    url = '/' + urltrang
  }else if(urltrang === 'cau-hoi-thuong-gap'){
    tieude = 'câu hỏi'
    url = '/' + urltrang
  }else if(urltrang === 'thong-tin-chung'){
    tieude = 'thông tin chung'
    url = '/' + urltrang
  }else if(urltrang === 'thong-tin-ung-dung'){
    tieude = 'thông tin giới thiệu'
    url = '/' + urltrang
  }else if(urltrang === 'lich-hen'){
    tieude = 'lịch hẹn của bệnh nhân ' + data.mabn.hoten
    url = '/' + urltrang + '/' + data._id
  }else if(urltrang === 'dmnhanvien'){
    tieude = 'thông tin nhân viên ' + data.tennv
    url = '/' + urltrang
  }
  
  return {tieude: tieude, url: url}
}
