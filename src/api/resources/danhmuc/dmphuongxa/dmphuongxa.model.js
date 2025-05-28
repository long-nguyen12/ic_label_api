import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const {Schema} = mongoose;
const dmphuongxaSchema = new Schema({
  _id: {type: String, required: true},
  tenxa: {
    type: String
  },
  matt: {
    type: mongoose.Schema.Types.String,
    ref: 'DmTinhThanh',
  },
  maqh: {
    type: mongoose.Schema.Types.String,
    ref: 'DmQuanHuyen',
  },
  is_deleted: {type: Boolean, default: false}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'dmphuongxa'
});
dmphuongxaSchema.plugin(mongoosePaginate);
export default mongoose.model('DmPhuongXa', dmphuongxaSchema);
