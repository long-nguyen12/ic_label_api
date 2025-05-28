import Joi from 'joi';
import bcrypt from 'bcryptjs';

export default {
  validateCreate(body, method) {

    let objSchema = {
      user_id: Joi.string().required().label('Mã nhà cung cấp').error((errors) => {
        return {
          template: 'không được bỏ trống',
          context: {
            errors: errors.length,
            codes: errors.map((err) => err.type)
          }
        };
      }),
      customer_full_name: Joi.string().required().label('Tên người dùng').error((errors) => {
        return {
          template: 'không được bỏ trống',
          context: {
            errors: errors.length,
            codes: errors.map((err) => err.type)
          }
        };
      }),
      // customer_email: Joi.string().label('Email')
      //   .email().error((errors) => {
      //     return {
      //       template: 'không đúng định dạng'
      //     };
      //   })
      //   .required().error((errors) => {
      //     return {
      //       template: 'không được bỏ trống'
      //     };
      //   }),

      customer_gender: Joi.string().allow(""),
      customer_mobi: Joi.string().required().label('Điện thoại').error((errors) => {
        return {
          template: 'không được bỏ trống'
        };
      }),
      customer_add: Joi.string().required().label('Địa chỉ').error((errors) => {
        return {
          template: 'không được bỏ trống'
        };
      }),
      // customer_bank_account_number: Joi.string().required().label('Số tk').error((errors) => {
      //   return {
      //     template: 'không được bỏ trống'
      //   };
      // }),
      // customer_tax_code: Joi.string().required().label('MST').error((errors) => {
      //   return {
      //     template: 'không được bỏ trống'
      //   };
      // })
    }

    let newSchema = {}
    if(method === 'POST'){
      newSchema = Object.assign({}, objSchema)
    }else{
      for (let key in objSchema) {
        if (objSchema.hasOwnProperty(key) && body.hasOwnProperty(key)) {
          newSchema[key] = objSchema[key]
        }
      }
    }

    let schema = Joi.object().keys(newSchema);
    const { value, error } = Joi.validate(body, schema, {allowUnknown: true , abortEarly: true});
    if (error && error.details) {
      return { error };
    }
    return { value };
  },
};
