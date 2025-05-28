import Joi from "joi";
import bcrypt from "bcryptjs";

export default {
    validateCreate(body, method) {
        let objSchema = {
            user_id: Joi.string()
                .required()
                .label("Mã nhà cung cấp")
                .error((errors) => {
                    return {
                        template: "không được bỏ trống",
                        context: {
                            errors: errors.length,
                            codes: errors.map((err) => err.type),
                        },
                    };
                }),
            position_name: Joi.string()
                .required()
                .label("Tên chức vụ")
                .error((errors) => {
                    return {
                        template: "không được bỏ trống",
                        context: {
                            errors: errors.length,
                            codes: errors.map((err) => err.type),
                        },
                    };
                }),
            position_discount: Joi.string().required()
                .label("Chiết khấu cho chức vụ")
                .required()
                .error((errors) => {
                    return {
                        template: "không được bỏ trống",
                    };
                }),
        };

        let newSchema = {};
        if (method === "POST") {
            newSchema = Object.assign({}, objSchema);
        } else {
            for (let key in objSchema) {
                if (objSchema.hasOwnProperty(key) && body.hasOwnProperty(key)) {
                    newSchema[key] = objSchema[key];
                }
            }
        }

        let schema = Joi.object().keys(newSchema);
        const { value, error } = Joi.validate(body, schema, {
            allowUnknown: true,
            abortEarly: true,
        });
        if (error && error.details) {
            return { error };
        }
        return { value };
    },
};
