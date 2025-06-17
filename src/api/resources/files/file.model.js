import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema } = mongoose;
const fileSchema = new Schema(
  {
    file_path: { type: String, required: true },
    is_deleted: { type: Boolean, default: false, select: false },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

fileSchema.plugin(mongoosePaginate);

export default mongoose.model("file", fileSchema);
