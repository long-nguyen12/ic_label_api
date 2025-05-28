import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const {Schema} = mongoose;
const thongtinchungSchema = new Schema({
    tendonvi: {type: String},
    duongdaynong: {type: String},
    email: {type: String},
    logo: {type: String},
    diachi: {type: String},
    gioithieu: {type: String},
    sangbatdau: {type: String},
    sangketthuc: {type: String},
    chieubatdau: {type: String},
    chieuketthuc: {type: String},
    toibatdau: {type: String},
    toiketthuc: {type: String},
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  });

thongtinchungSchema.plugin(mongoosePaginate);
export default mongoose.model('ThongTinChung', thongtinchungSchema);
