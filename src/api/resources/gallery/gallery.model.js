import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema } = mongoose;
const gallerySchema = new Schema(
  {
    dataset_id: { type: Schema.Types.ObjectId, ref: "Dataset", required: true },
    image_name: { type: String, required: true },
    image_caption: { type: Object, default: {} },
    image_bbox: { type: Array },
    image_detection: { type: String },
    have_caption: { type: Boolean, default: false },
    have_bbox: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false, select: false },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

gallerySchema.plugin(mongoosePaginate);

export default mongoose.model("gallery", gallerySchema);
