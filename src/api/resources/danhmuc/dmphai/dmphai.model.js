import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const {Schema} = mongoose;
const dmphaiSchema = new Schema({
  _id: {type: String, required: true},
  tenphai: {
    type: String
  },
  is_deleted: {type: Boolean, default: false}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'dmphai'
});
dmphaiSchema.plugin(mongoosePaginate);
export default mongoose.model('DmPhai', dmphaiSchema);
