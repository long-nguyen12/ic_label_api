import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const {Schema} = mongoose;
const dmdoituongSchema = new Schema({
  _id: {type: Number, required: true},
  tendoituong: {
    type: String
  },
  bhyt: {type: Boolean, default: false},
  is_deleted: {type: Boolean, default: false}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'dmdoituong'
});
dmdoituongSchema.plugin(mongoosePaginate);
export default mongoose.model('DmDoiTuong', dmdoituongSchema);
