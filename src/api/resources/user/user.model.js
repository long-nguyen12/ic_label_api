import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema } = mongoose;
const userSchema = new Schema(
    {
        user_name: { type: String, required: true, unique: true },
        user_pass: { type: String, required: true },
        user_full_name: { type: String, required: true },
        user_mobi: { type: String, required: true },
        user_email: { type: String, required: true },
        user_add: { type: String, required: false },
        user_classify: {
            ref: "PhanQuyenVaiTro",
            type: mongoose.Schema.Types.ObjectId,
        },
        user_gender: { type: String },
        user_avatar: { type: String },
        role: { type: String }, // user, admin, superadmin
        is_deleted: { type: Boolean, default: false, select: false },
        active: { type: Boolean, default: true },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

userSchema.plugin(mongoosePaginate);

export default mongoose.model("User", userSchema);
