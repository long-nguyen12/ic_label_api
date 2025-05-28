import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const {Schema} = mongoose;
const dmtinhthanhSchema = new Schema({
  _id: {type: String, required: true},
  tentinh: {
    type: String
  },
  is_deleted: {type: Boolean, default: false}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'dmtinhthanh'
});
dmtinhthanhSchema.plugin(mongoosePaginate);
export default mongoose.model('DmTinhThanh', dmtinhthanhSchema);
