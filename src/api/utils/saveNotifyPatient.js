import ThongBaoBenhNhan from '../../api/resources/thongbaobenhnhan/thongbaobenhnhan.model';
import DangKy from '../../api/resources/dangky/dangky.model';
import KhamBenh from '../../api/resources/khambenh/khambenh.model';
import DienBien from '../../api/resources/dienbien/dienbien.model';
import ChanDoan from '../../api/resources/chandoan/chandoan.model';
import ThanhToan from '../../api/resources/thanhtoan/thanhtoan.model';
import ThanhToanCT from '../../api/resources/thanhtoanct/thanhtoanct.model';

import KetQuaCLS from '../../api/resources/ketquacls/ketquacls.model';
import DonThuoc from '../../api/resources/donthuoc/donthuoc.model';
import HenKham from '../../api/resources/henkham/henkham.model';
import {pushMobileToPatient} from "./pushNotifyMobile";
import moment from 'moment';
export async function saveNotifyPatient(data, typePush, khambenh) {
  try {
    let chitietThongBao = null
    let thongtinbenhnhan = null
    let dataAdd = {
      viewYn: false,
      tieude: '',
      noidung: '',
      push_link_id: '',
      benhnhan_id: '',
      loaithongbao: typePush
    }
    let khambenhInfo = null;
    if(khambenh){
      khambenhInfo = await KhamBenh.findById(khambenh._id)
        .populate({path: 'makk', select: 'tenkk'})
        .populate({path: 'maphong', select: 'tenphong'})
    }
    // kiểm tra là push loại gì.
    if (typePush === 'DANGKY') {
      chitietThongBao = await DangKy.findById(data._id).populate({path: 'mabn', select: 'device_tokens'}).lean();
      thongtinbenhnhan = chitietThongBao.mabn

      dataAdd.tieude = 'Đăng ký khám bệnh';
      dataAdd.noidung = 'Bạn có thông tin đăng ký khám bệnh tại phòng ' + khambenhInfo?.maphong?.tenphong + ' STT khám: ' + khambenh.sothutukhambenh;
      dataAdd.push_link_id = chitietThongBao._id;
      dataAdd.loaithongbao_id = chitietThongBao._id;
      dataAdd.benhnhan_id = thongtinbenhnhan._id;
      dataAdd.tab_id = khambenhInfo._id;
    }
    else if(typePush === 'DIENBIEN'){
      let dienbien = await DienBien.findById(data._id)
        .populate({path: 'makhambenh', select: 'maphong', populate : {path: 'maphong', select: 'tenphong'}})
        .populate({path: 'makcb', select: 'mabn', populate: {path: 'mabn', select: 'device_tokens'}}).lean();
      thongtinbenhnhan = dienbien.makcb.mabn;

      dataAdd.tieude = 'Chỉ số sinh tồn';
      dataAdd.noidung = 'Bạn có kết quả chỉ số sinh tồn phòng ' + dienbien?.makhambenh?.maphong?.tenphong;
      dataAdd.push_link_id = dienbien?.makcb?._id;
      dataAdd.loaithongbao_id = dienbien._id;
      dataAdd.benhnhan_id = dienbien?.makcb?.mabn?._id;
      dataAdd.tab_id = dienbien?.makhambenh?._id;
    }
    else if(typePush === 'CHANDOAN'){
      let chandoan = await ChanDoan.findById(data._id)
        .populate({path: 'ma', select: 'maphong', populate : {path: 'maphong', select: 'tenphong'}})
        .populate({path: 'makcb', select: 'mabn', populate: {path: 'mabn', select: 'device_tokens'}}).lean();
      thongtinbenhnhan = chandoan.makcb.mabn;

      dataAdd.tieude = 'Kết quả chẩn đoán';
      dataAdd.noidung = 'Bạn có kết quả chẩn đoán bệnh phòng ' + chandoan.ma.maphong.tenphong;
      dataAdd.push_link_id = chandoan.makcb._id;
      dataAdd.loaithongbao_id = chandoan._id;
      dataAdd.benhnhan_id = chandoan.makcb.mabn._id;
      dataAdd.tab_id = chandoan.ma._id;
    }
    else if(typePush === 'KHAMBENH'){
      let khambenh = await KhamBenh.findById(data._id)
        .populate({path: 'maphong', select: 'tenphong'})
        .populate({path: 'makcb', select: 'mabn', populate: {path: 'mabn', select: 'device_tokens'}}).lean();
      thongtinbenhnhan = khambenh.makcb.mabn;

      dataAdd.tieude = 'Đăng ký phòng khám';
      dataAdd.noidung = 'Bạn đã được đăng ký đến phòng ' + khambenh?.maphong?.tenphong;
      dataAdd.push_link_id = khambenh?.makcb?._id;
      dataAdd.loaithongbao_id = khambenh._id;
      dataAdd.benhnhan_id = khambenh?.makcb?.mabn?._id;
      dataAdd.tab_id = khambenh._id;
    }
    else if(typePush === 'THANHTOANCT'){
      // thông tin thanh toán chi tiết.
      let thanhtoanct = await ThanhToanCT.findById(data._id)
        .populate({path: 'mahh', select:'tendichvu'}).lean()
      // thông tin thanh toán.
      let thanhtoan = await ThanhToan.findById(thanhtoanct.mathanhtoan)
        .populate({path: 'maphong', select: 'tenphong'})
        .populate({path: 'makcb', select: 'mabn', populate: {path: 'mabn', select: 'device_tokens'}}).lean();

      thongtinbenhnhan = thanhtoan.makcb.mabn;
      dataAdd.tieude = 'Đăng ký dịch vụ';
      dataAdd.noidung = 'Bạn đã được đăng ký dịch vụ ' + thanhtoanct?.mahh?.tendichvu + ' phòng ' + thanhtoan?.maphong?.tenphong;
      dataAdd.push_link_id = thanhtoan?.makcb?._id;
      dataAdd.loaithongbao_id = thanhtoanct._id;
      dataAdd.benhnhan_id = thanhtoan?.makcb?.mabn?._id;
      dataAdd.tab_id = thanhtoan.makhambenh;
    }
    else if(typePush === 'KETQUACLS'){
      let ketquacls = await KetQuaCLS.findById(data._id)
        .populate({path: 'mahh', select: 'tendichvu'})
        .populate({path: 'mathanhtoan', select: 'makhambenh'})
        .populate({path: 'makcb', select: 'mabn', populate: {path: 'mabn', select: 'device_tokens'}}).lean();
      thongtinbenhnhan = ketquacls.makcb.mabn;

      dataAdd.tieude = 'Kết quả cận lâm sàng';
      dataAdd.noidung = 'Bạn đã có kết quả dịch vụ ' + ketquacls?.mahh?.tendichvu;
      dataAdd.push_link_id = ketquacls?.makcb?._id;
      dataAdd.loaithongbao_id = ketquacls._id;
      dataAdd.benhnhan_id = ketquacls?.makcb?.mabn?._id;
      dataAdd.tab_id = ketquacls?.mathanhtoan?.makhambenh;
    }
    else if(typePush === 'DONTHUOC'){
      let donthuoc = await DonThuoc.findById(data._id)
        .populate({path: 'makcb', select: 'mabn', populate: {path: 'mabn', select: 'device_tokens'}})
        .populate({path: 'makhambenh', select: 'maphong', populate: {path: 'maphong', select: 'tenphong'}})
        .lean();
      thongtinbenhnhan = donthuoc.makcb.mabn;
      dataAdd.tieude = 'Đơn thuốc';
      dataAdd.noidung = 'Bạn đã được kê đơn thuốc tại phòng ' + donthuoc?.makhambenh?.maphong?.tenphong;
      dataAdd.push_link_id = donthuoc.makcb?._id;
      dataAdd.loaithongbao_id = donthuoc._id;
      dataAdd.benhnhan_id = donthuoc.makcb?.mabn?._id;
      dataAdd.tab_id = donthuoc?.makhambenh?._id;
    }
    else if(typePush === 'HENKHAM'){
      let henkham = await HenKham.findById(data._id)
        .populate({path: 'makcb', select: 'mabn', populate: {path: 'mabn', select: 'device_tokens'}})
        .populate({path: 'maphong', select: 'tenphong'})
        .lean();
      thongtinbenhnhan = henkham.makcb ? henkham.makcb.mabn : {};

      let dateFormat = henkham.ngay
      let ngaykham = `${('0' + dateFormat.getDate()).slice(-2)}/${('0' + (dateFormat.getMonth() + 1)).slice(-2)}/${dateFormat.getFullYear()}`;

      dataAdd.tieude = 'Lịch hẹn khám';
      dataAdd.noidung = 'Bạn đã được lên lịch khám lại ngày ' + ngaykham + ' phòng ' + henkham?.maphong?.tenphong;
      dataAdd.push_link_id = henkham?.makcb?._id;
      dataAdd.loaithongbao_id = henkham._id;
      dataAdd.benhnhan_id = henkham?.makcb?.mabn?._id;
      dataAdd.tab_id = '';
    }
    else if(typePush === 'KETTHUCKHAM'){
      dataAdd.tieude = 'Kết thúc khám bệnh';
      dataAdd.noidung = 'Bạn đã kết thúc khám bệnh mã khám chữa bệnh: ' + data._id;
      dataAdd.push_link_id = data._id;
      dataAdd.loaithongbao_id = data._id;
      dataAdd.benhnhan_id = data?.mabn?._id;
      dataAdd.tab_id = '';

      thongtinbenhnhan = data.mabn
    }
    else if(typePush === 'NHACDONTHUOC'){
      let donthuoc = await DonThuoc.findById(data._id)
        .populate({path: 'makcb', select: 'mabn', populate: {path: 'mabn', select: 'device_tokens'}})
        .populate({path: 'makhambenh', select: 'maphong', populate: {path: 'maphong', select: 'tenphong'}})
        .populate({path: 'manv', select: 'tennv'})
        .lean();
      thongtinbenhnhan = donthuoc.makcb.mabn;
      dataAdd.tieude = 'Nhắc uống thuốc';
      dataAdd.noidung = 'Bạn có đơn thuốc cần uống thuốc theo đơn của bác sỹ ' + donthuoc?.manv?.tennv + ' phòng ' + donthuoc?.makhambenh?.maphong?.tenphong;
      dataAdd.push_link_id = donthuoc.makcb._id;
      dataAdd.loaithongbao_id = donthuoc._id;
      dataAdd.benhnhan_id = donthuoc?.makcb?.mabn?._id;
      dataAdd.tab_id = donthuoc?.makhambenh?._id;
    }
    else if(typePush === 'GOIDICHVU'){
      thongtinbenhnhan = data?.benhnhan_id;
      dataAdd.tieude = 'Đăng ký gói dịch vụ';
      if(data.trangthai === 0)
        dataAdd.noidung = data.goidichvu_id.tengoi + ' từ chối xác nhận.';
      else if(data.trangthai === 1)
        dataAdd.noidung = data.goidichvu_id.tengoi + ' đã được xác nhận thành công.';
      else if(data.trangthai === 2)
        dataAdd.noidung = data.goidichvu_id.tengoi + ' đã được trả kết quả thành công.';

      dataAdd.push_link_id = data._id;
      dataAdd.loaithongbao_id = data._id;
      dataAdd.benhnhan_id = data.benhnhan_id._id;
    }
    else if(typePush === 'LICHHEN'){
      thongtinbenhnhan = data.mabn;
      dataAdd.tieude = 'Lịch hẹn khám bệnh';
      if(data.tabindex === 1)
        dataAdd.noidung = 'Lịch hẹn tại ' + (data.maphong ? data.maphong.tenphong : ('ngày ' + moment(data.ngaydatlich).format('DD/MM/YYYY - H:mm'))) + ' đã được xác nhận.';
      else if(data.tabindex === 2)
        dataAdd.noidung = 'Lịch hẹn tại ' + (data.maphong ? data.maphong.tenphong : ('ngày ' + moment(data.ngaydatlich).format('DD/MM/YYYY - H:mm'))) + ' đã được trả kết quả thành công.';

      dataAdd.push_link_id = data._id;
      dataAdd.loaithongbao_id = data._id;
      dataAdd.benhnhan_id = data?.mabn?._id;
    }
    else if(typePush === 'HOIDAP'){
      thongtinbenhnhan = data.mabn;
      dataAdd.tieude = 'Hỏi đáp';
      if(data.trangthai === 2)
        dataAdd.noidung = `Câu hỏi đáp - góp ý của bạn đã được trả lời.`;
      else if(data.tabindex === 2)
        dataAdd.noidung = 'Câu hỏi đáp - góp ý của bạn đã bị từ chối trả lời.';

      dataAdd.push_link_id = data._id;
      dataAdd.loaithongbao_id = data._id;
      dataAdd.benhnhan_id = data.mabn._id;
    }

    // Tạo mới notify.
    let notiCreate = await ThongBaoBenhNhan.create(dataAdd);

    // đếm badge hiển thị trên app.
    let pushCount = await ThongBaoBenhNhan.count({benhnhan_id: thongtinbenhnhan._id, viewYn: false});
    let device_tokens = thongtinbenhnhan.device_tokens ? thongtinbenhnhan.device_tokens : [];
    pushMobileToPatient(notiCreate, device_tokens, pushCount, typePush);
  } catch (e) {
    console.log(e)
  }
}

