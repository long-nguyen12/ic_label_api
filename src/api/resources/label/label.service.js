import Joi from "joi";

export default {
  validateCreate(body, method) {
    let objSchema = {
      label_name: Joi.string()
        .required()
        .label("Tên nhãn")
        .error((errors) => {
          return {
            template: "không được bỏ trống",
            context: {
              errors: errors.length,
              codes: errors.map((err) => err.type),
            },
          };
        }),
      label_color: Joi.string()
        .required()
        .label("Màu nhãn")
        .error((errors) => {
          return {
            template: "không được bỏ trống",
            context: {
              errors: errors.length,
              codes: errors.map((err) => err.type),
            },
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
