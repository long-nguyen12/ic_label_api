import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema } = mongoose;
const customerSchema = new Schema(
    {
        user_id: {
            ref: "User",
            type: mongoose.Schema.Types.ObjectId,
        },
        customer_full_name: { type: String, required: true },
        customer_mobi: { type: String, required: true },
        customer_email: { type: String, required: false },
        customer_add: { type: String, required: true },
        customer_bank_account_number: { type: String, required: false },
        customer_bank_account_info: { type: String, required: false },
        customer_tax_code: { type: String, required: false },
        customer_gender: { type: String },
        customer_discount: { type: String },
        position_id: {
          ref: "Position",
          type: mongoose.Schema.Types.ObjectId,
        },

        customer_note: { type: String },
        is_deleted: { type: Boolean, default: false, select: false },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

customerSchema.plugin(mongoosePaginate);

export default mongoose.model("Customer", customerSchema);
