import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;
const lichsuhoatdongSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  thaotac: {type: String}, // 1 Thêm, 2 Sửa, 3 Xoá, 4 Khác, 5 Trả lời, 6 Xác nhận
  tentrang: {type: String},
  urltrang: {type: String},
  doituong_id: {type: String},
  tieude: {type: String},
},{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'lichsuhoatdong'
});

const chitietlichsuSchema = new Schema({
  data: {},
  document_id: {type: String},
  type: String,
  user_id: {type: Schema.Types.ObjectId, ref: 'User'},
  lichsu_id: {type: Schema.Types.ObjectId, ref: 'LichSuHoatDong'}
}, {
  timestamps: {
    createdAt: 'created_at'
  },
  collection: 'chitietlichsu'
})
let ChiTietLichSuHistory = mongoose.model('ChiTietLichSuHistory', chitietlichsuSchema);
export {ChiTietLichSuHistory}

lichsuhoatdongSchema.plugin(mongoosePaginate);
export default mongoose.model('LichSuHoatDong', lichsuhoatdongSchema);
