import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const {Schema} = mongoose;
const salebillsdetailSchema = new Schema(
  {
    product_price: {type: String},
    product_number: {type: String, required: true},
    // % Chiết khấu
    product_discount: {type: String},
    // Chiết khấu (VND)
    product_discount_money: {type: String},
    // Tổng tiền chưa chiết khấu
    total_money: {type: String},
    // Tổng tiền sau khi đã chiết khấu
    total_money_after_discount: {type: String},
    product_unit: {type: String, required: true},
    product_id:
      {
        ref: "Product",
        type: mongoose.Schema.Types.ObjectId,
      }
    ,
    salebills_id: {
      ref: "Salebills",
      type: mongoose.Schema.Types.ObjectId
    },
    user_id_manager: {
      ref: "User",
      type: mongoose.Schema.Types.ObjectId,
    },
    is_deleted: {type: Boolean, default: false, select: false},
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    collection: "salebillsdetail"
  }
);

salebillsdetailSchema.plugin(mongoosePaginate);

export default mongoose.model("Salebillsdetail", salebillsdetailSchema);
