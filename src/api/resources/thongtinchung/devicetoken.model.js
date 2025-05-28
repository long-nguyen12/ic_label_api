import mongoose from 'mongoose';

const { Schema } = mongoose;
const devicetokenSchema = new Schema({
  device_token: {
    type: String,
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});
export default mongoose.model('DeviceToken', devicetokenSchema);
