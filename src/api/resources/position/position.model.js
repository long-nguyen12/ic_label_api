import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema } = mongoose;
const positionSchema = new Schema(
    {
        user_id: {
            ref: "User",
            type: mongoose.Schema.Types.ObjectId,
        },
        position_name: { type: String, required: true },
        position_code: { type: String },
        position_discount : { type: String, required: true },
        position_description: { type: String},
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
