import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema } = mongoose;
const gallerySchema = new Schema(
  {
    dataset_id: { type: Schema.Types.ObjectId, ref: "dataset", required: true },
    image_index: { type: Number },
    image_name: { type: String, required: true },
    image_caption: { type: Array, default: [] },
    image_bbox: { type: Array },
    image_detection: { type: String },
    image_width: { type: Number },
    image_height: { type: Number },
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

// gallerySchema.index({ dataset_id: 1, have_caption: 1, is_deleted: 1 });
// gallerySchema.index({ image_name: 1 });

gallerySchema.plugin(mongoosePaginate);

export default mongoose.model("gallery", gallerySchema);
