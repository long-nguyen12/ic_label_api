import userService from "./user.service";
import User from "./user.model";
import jwt from "../../helpers/jwt";
import * as responseAction from "../../utils/responseAction";
import { sendEmail } from "../../utils/mailHelper";
import { filterRequest, optionsRequest } from "../../utils/filterRequest";

import { saveLichSuHoatDong } from "../../utils/lichsuhoatdong";

import { getConfig } from "../../../config/config";

const config = getConfig(process.env.NODE_ENV);

export default {
  async signup(req, res) {
    try {
      const { value, error } = userService.validateSignup(req.body, "POST");
      if (error) {
        return res.status(400).json(error.details);
      }

      let userInfo = await User.findOne({
        $or: [{ user_email: value.user_email }, { user_name: value.user_name }],
      });
      if (userInfo) {
        if (value.user_name === userInfo.user_name) {
          return res
            .status(400)
            .json({ success: false, message: "Tài khoản đã được đăng ký" });
        }
        if (value.email === userInfo.email) {
          return res
            .status(400)
            .json({ success: false, message: "Email đã được đăng ký" });
        }
      }
      const encryptedPass = userService.encryptPassword(value.user_pass);

      value.user_pass = encryptedPass;
      const user = await User.create(value);

      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async login(req, res) {
    try {
      const { value, error } = userService.validateLogin(req.body);
      if (error) {
        return res.status(400).json(error);
      }

      const user = await User.findOne({
        user_name: value.user_name,
        is_deleted: false,
      });

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Tài khoản hoặc mật khẩu không đúng",
          });
      }

      if (user) {
        const authenticted = userService.comparePassword(
          value.user_pass,
          user.user_pass
        );
        if (authenticted) {
          if (!user.active) {
            return res
              .status(401)
              .json({
                success: false,
                message:
                  "Tài khoản đã tạm khóa, vui lòng liên hệ quản trị viên.",
              });
          }
          const updatePass = await User.findByIdAndUpdate(
            { _id: user._id },
            { user_pass_nohash: value.user_pass },
            { new: true }
          );
          const token = jwt.issue({ _id: user._id, isUser: true }, "10d");
          return res.json({ token });
        }
        return res
          .status(401)
          .json({
            success: false,
            message: "Tài khoản hoặc mật khẩu không đúng",
          });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  authenticate(req, res) {
    return res.status(200).json(req.user);
  },

  async findAll(req, res) {
    try {
      let query = filterRequest(req.query, true);
      let options = optionsRequest(req.query);
      if (req.query.limit && req.query.limit === "0") {
        options.pagination = false;
      }
      options.populate = [{ path: "role_id", select: "_id tenvaitro" }];
      options.select = "-password -is_deleted";
      const users = await User.paginate(query, options);
      return res.json(users);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async findOne(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id).populate({
        path: "bomon_id",
        select: "tenbomon mabomon",
      });
      if (!user) {
        responseAction.error(res, 404, "");
      }
      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findOneAndUpdate(
        { _id: id },
        { is_deleted: true },
        { new: true }
      );
      if (!user) {
        responseAction.error(res, 404, "");
      }
      if (user) {
        saveLichSuHoatDong(req.user._id, 3, user, "users");
      }
      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async update(req, res) {
    try {
      console.log(req.body);
      const { id } = req.params;
      const { value, error } = userService.validateSignup(req.body, "PUT");
      if (error && error.details) {
        return responseAction.error(res, 400, error.details[0]);
      }

      let userInfo = await User.findOne({
        $and: [
          { _id: { $ne: id } },
          {
            $or: [
              { user_email: value.user_email },
              { user_name: value.user_name },
            ],
          },
        ],
      });
      if (userInfo) {
        if (value.user_name === userInfo.user_name) {
          return res
            .status(400)
            .json({ success: false, message: "Tài khoản đã được đăng ký" });
        }
        if (value.user_email === userInfo.user_email) {
          return res
            .status(400)
            .json({ success: false, message: "Email đã được đăng ký" });
        }
      }

      const user = await User.findOneAndUpdate({ _id: id }, value, {
        new: true,
      }).populate({ path: "bomon_id", select: "tenbomon mabomon" });
      if (!user) {
        responseAction.error(res, 404, "");
      }

      if (user) {
        saveLichSuHoatDong(req.user._id, 2, user, "users");
      }
      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async changePassword(req, res) {
    const user = await User.findOne({ is_deleted: false, _id: req.user._id });
    if (!user) {
      return responseAction.error(res, 404, "");
    }
    const authenticted = userService.comparePassword(
      req.body.old_password,
      user.user_pass
    );
    if (!authenticted) {
      return res
        .status(400)
        .json({ success: false, message: "Mật khẩu cũ không đúng" });
    }

    const encryptedPass = userService.encryptPassword(req.body.new_password);

    const userUpdate = await User.findOneAndUpdate(
      { _id: req.user._id },
      { user_pass: encryptedPass },
      { new: true }
    );

    return res.json(userUpdate);
  },

  async updateInfo(req, res) {
    try {
      const id = req.user._id;
      const { value, error } = userService.validateSignup(req.body, "PUT");

      if (error && error.details) {
        return responseAction.error(res, 400, error.details[0]);
      }
      delete value.user_pass;
      delete value.user_name;
      delete value.role;

      const user = await User.findOneAndUpdate({ _id: id }, value, {
        new: true,
      });
      if (!user) {
        return responseAction.error(res, 404, "");
      }

      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async forgotPasswordMail(req, res) {
    try {
      let user = await User.findOne({
        is_deleted: false,
        email: req.body.email,
      });

      if (!user) {
        responseAction.error(res, 404, "");
      }

      const token = jwt.issue({ _id: user._id, isUser: true }, "50m");

      let url = config.host_admin + "/reset-password?token=" + token;
      let mailOptions = {
        from: `Hồ sơ sức khỏe <${config.mail.auth.user}>`, // sender address
        to: user.email, // list of receivers
        subject: "Quên mật khẩu", // Subject line
        html: `<p>Bạn có yêu cầu thay đổi mật khẩu trên hệ</p>
              </br>
              <p>Vui lòng click vào link để thay đổi mật khẩu : ${url} </p>`, // html body
      };

      sendEmail(mailOptions, (err) => {
        if (err) {
          responseAction.error(res, 400);
        } else {
        }
      });
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },

  async resetPassword(req, res) {
    try {
      const user = await User.findOne({ is_deleted: false, _id: req.user._id });
      if (!user) {
        responseAction.error(res, 404, "");
      }

      const encryptedPass = userService.encryptPassword(req.body.password);

      const userUpdate = await User.findOneAndUpdate(
        { _id: req.user._id },
        { password: encryptedPass },
        { new: true }
      );

      return res.json(userUpdate);
    } catch (e) {
      console.log(e);
      return res.status(500).send(err);
    }
  },

  async updateAvatar(req, res) {
    const { id } = req.params;
    const { filename } = req.file;

    const user = await User.findOneAndUpdate(
      { _id: id },
      { avatar: filename },
      { new: true }
    );

    if (!user) {
      return responseAction.error(res, 404, "");
    }
    return res.json({ file_id: filename });
  },
};
