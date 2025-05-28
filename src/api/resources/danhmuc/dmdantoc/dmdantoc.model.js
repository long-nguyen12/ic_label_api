import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const {Schema} = mongoose;
const dmdantocSchema = new Schema({
  _id: {type: String, required: true},
  tendantoc: {
    type: String
  },
  tengoikhac: {
    type: String
  },
  is_deleted: {type: Boolean, default: false}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'dmdantoc'
});
dmdantocSchema.plugin(mongoosePaginate);
export default mongoose.model('DmDanToc', dmdantocSchema);
