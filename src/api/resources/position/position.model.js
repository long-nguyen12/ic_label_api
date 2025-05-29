import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema } = mongoose;
const positionSchema = new Schema(
  {
    position_name: { type: String, required: true },
    position_description: { type: String },
    is_deleted: { type: Boolean, default: false, select: false },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

positionSchema.plugin(mongoosePaginate);

export default mongoose.model("Position", positionSchema);
