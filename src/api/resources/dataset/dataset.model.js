import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema } = mongoose;
const datasetSchema = new Schema(
  {
    dataset_name: { type: String, required: true },
    dataset_path: { type: String, required: true },
    dataset_note: { type: String },
    dataset_num: { type: Number },
    annotator_id: { type: Schema.Types.ObjectId, ref: "User" },
    is_deleted: { type: Boolean, default: false, select: false },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Virtuals for captioned_images and all_images
datasetSchema.virtual('captioned_images', {
  ref: 'Gallery',
  localField: '_id',
  foreignField: 'dataset_id',
  justOne: false,
  options: { match: { have_caption: true } },
});

datasetSchema.virtual('all_images', {
  ref: 'Gallery',
  localField: '_id',
  foreignField: 'dataset_id',
  justOne: false,
  options: { match: { is_deleted: false } },
});


datasetSchema.plugin(mongoosePaginate);

export default mongoose.model("dataset", datasetSchema);
