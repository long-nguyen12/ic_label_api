import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema } = mongoose;
const labelSchema = new Schema(
  {
    label_name: { type: String, required: true },
    label_color: { type: String, required: true },
    label_vietnamese: { type: String },
    label_count: { type: String },
    is_deleted: { type: Boolean, default: false, select: false },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

labelSchema.plugin(mongoosePaginate);

export default mongoose.model("label", labelSchema);
