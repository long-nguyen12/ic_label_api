import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema } = mongoose;
const productSchema = new Schema(
    {
        user_id: {
            ref: "User",
            type: mongoose.Schema.Types.ObjectId,
        },
        product_name: { type: String, required: true },
        product_description: { type: String },
        product_price: { type: String, required: true },
        product_discount: { type: String},
        product_unit: { type: String, required: true},
        product_image: {type: Array},
        is_deleted: { type: Boolean, default: false, select: false },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

productSchema.plugin(mongoosePaginate);

export default mongoose.model("Product", productSchema);
