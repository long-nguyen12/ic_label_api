import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const {Schema} = mongoose;
const dmquoctichSchema = new Schema({
  _id: {type: String, required: true},
  tenquoctich: {
    type: String
  },
  is_deleted: {type: Boolean, default: false}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'dmquoctich'
});
dmquoctichSchema.plugin(mongoosePaginate);
export default mongoose.model('DmQuocTich', dmquoctichSchema);
