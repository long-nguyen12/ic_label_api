import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const {Schema} = mongoose;
const dmdonviSchema = new Schema({
  madonvi: {
    type: String
  },
  tendonvi: {
    type: String
  },
  is_deleted: {type: Boolean, default: false}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'dmdonvi'
});
dmdonviSchema.plugin(mongoosePaginate);
export default mongoose.model('DmDonVi', dmdonviSchema);
