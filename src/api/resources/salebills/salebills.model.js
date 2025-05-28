import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const {Schema} = mongoose;
const salebillsSchema = new Schema(
  {
    sale_id: {type: String, required: true},
    sale_name: {type: String, required: false},
    sale_date: {type: Date, required: true},
    sale_category: {type: String, required: false},
    sale_total_payable_all: {type: String},
    // Thuế giá trị gia tăng %
    sale_vat_tax: {type: String},
    // Tiền Thuế giá trị gia tăng VND
    sale_vat_tax_money: {type: String},
    // Chiết khấu %
    sale_discount: {type: String},
    // Tiền chiết khấu VND
    sale_discount_money: {type: String},
    sale_total_payable_a_discount: {type: String},
    sale_pay_bills: {type: String},
    sale_pay_bills_date: {type: String},
    sale_pay_bills_number: {type: String},
    sale_remark: {type: String, required: false},
    // Tiền khách hàng đã thanh toán
    sale_bills_paid: {type: String},
    // Tiền khách hàng còn nợ
    sale_bills_debt: {type: String},
    customer_id: {
      ref: "Customer",
      type: mongoose.Schema.Types.ObjectId
    },
    user_id_manager: {
      ref: "User",
      type: mongoose.Schema.Types.ObjectId,
    },
    sale_image_bills: [],

    // Chiết khấu theo chức vụ
    // Lưu vào bill tại thời điểm thêm mới đơn hàng
    // Vì chức vụ của khách hàng có thể thay đổi => Chiết khấu thay đổi.
    sale_position_discount: {type: String, required: true},
    sale_position_id: {
      ref: "Position",
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    // Lợi nhuận của chị Thư trong đơn hàng
    sale_user_discount: {type: String, required: true},
    sale_profit_money: {type: String, required: true},
    sale_profit_discount: {type: String, required: true},

    // Tiền đơn hàng không trừ chiết khấu
    sale_all_money_not_discount: {type: String, required: true},

    is_deleted: {type: Boolean, default: false, select: false},
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    collection: "salebills"
  }
);

salebillsSchema.plugin(mongoosePaginate);

export default mongoose.model("Salebills", salebillsSchema);
