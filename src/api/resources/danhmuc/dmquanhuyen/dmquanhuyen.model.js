import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const {Schema} = mongoose;
const dmquanhuyenSchema = new Schema({
  _id: {type: String, required: true},
  tenhuyen: {
    type: String
  },
  matt: {
    type: String,
    ref: 'DmTinhThanh',
  },
  is_deleted: {type: Boolean, default: false}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'dmquanhuyen'
});
dmquanhuyenSchema.plugin(mongoosePaginate);
export default mongoose.model('DmQuanHuyen', dmquanhuyenSchema);
