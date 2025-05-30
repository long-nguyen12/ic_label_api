import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const phanquyenvaitroSchema = new Schema({
  tenvaitro: {type: String},
  is_deleted: {type: Boolean, default: false},
  vaitro: {},
  mota: {type: String},
},{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'phanquyenvaitro'
});
phanquyenvaitroSchema.plugin(mongoosePaginate);
export default mongoose.model('PhanQuyenVaiTro', phanquyenvaitroSchema);
