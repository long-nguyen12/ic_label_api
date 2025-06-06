import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const {Schema} = mongoose;
const dmnghenghiepSchema = new Schema({
  _id: {type: String, required: true},
  tennghenghiep: {
    type: String
  },
  is_deleted: {type: Boolean, default: false}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'dmnghenghiep'
});
dmnghenghiepSchema.plugin(mongoosePaginate);
export default mongoose.model('DmNgheNghiep', dmnghenghiepSchema);
