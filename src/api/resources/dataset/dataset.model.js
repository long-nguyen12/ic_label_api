import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema } = mongoose;
const datasetSchema = new Schema(
  {
    dataset_name: { type: String, required: true },
    dataset_path: { type: String, required: true },
    dataset_note: { type: String },
    dataset_num: { type: Number },
    is_deleted: { type: Boolean, default: false, select: false },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

datasetSchema.plugin(mongoosePaginate);

export default mongoose.model("dataset", datasetSchema);
