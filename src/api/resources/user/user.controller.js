import userService from "./user.service";
import User from "./user.model";
import jwt from "../../helpers/jwt";
import * as responseAction from "../../utils/responseAction";
import { sendEmail } from "../../utils/mailHelper";
import { filterRequest, optionsRequest } from "../../utils/filterRequest";

import {
  saveLichSuHoatDong,
  addLichSuHoatDong,
} from "../../utils/lichsuhoatdong";

import { getConfig } from "../../../config/config";
import { generateStrongPassword } from "../../utils/utils";
import Mailjet from "node-mailjet";

const config = getConfig(process.env.NODE_ENV);

const mailjet = Mailjet.apiConnect(
  config.MAILJET_API_KEY,
  config.MAILJET_SECRET_KEY
);

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

      const strongPassword = generateStrongPassword(8);
      const encryptedPass = userService.encryptPassword(strongPassword);

      try {
        await mailjet.post("send", { version: "v3.1" }).request({
          Messages: [
            {
              From: {
                Email: config.MAILER_AUTH_USER,
                Name: "Hệ thống gán nhãn",
              },
              To: [
                {
                  Email: value.user_email,
                  Name: value.user_full_name,
                },
              ],
              Subject: "Cấp tài khoản mới mới",
              TextPart: `Bạn đã được cấp tài khoản mới. Vui lòng truy cập hệ thống bằng tài khoản đã được cấp.`,
              HTMLPart: `<p>Chào ${value.user_full_name},</p>
                          <p>Bạn đã được cấp lại tài khoản mới mới.</>
                          <p>Tên đăng nhập: <strong>"${user_name}"</strong>.</p>
                          <p>Mật khẩu: <strong>"${strongPassword}"</strong>.</p>
                          <p>Vui lòng truy cập hệ thống bằng tài khoản đã được cấp.</p>
                          <p>Trân trọng,</p>
                          <p>Hệ thống gán nhãn</p>`,
            },
          ],
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }

      // const encryptedPass = userService.encryptPassword(value.user_pass);

      value.user_pass = encryptedPass;
      const user = await User.create(value);
      if (user) {
        addLichSuHoatDong(user._id, `Đăng ký tài khoản ${user.user_full_name}`);
      }
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
      }).populate({
        path: "user_classify",
        select: "_id tenvaitro",
      });

      if (!user) {
        return res.status(401).json({
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
            return res.status(401).json({
              success: false,
              message: "Tài khoản đã tạm khóa, vui lòng liên hệ quản trị viên.",
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
        return res.status(401).json({
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
      options.populate = [{ path: "user_classify", select: "_id tenvaitro" }];
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
        path: "user_classify",
        select: "_id tenvaitro",
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
        addLichSuHoatDong(req.user._id, `Xoá tài khoản ${user.user_full_name}`);
      }
      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
  async update(req, res) {
    try {
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
        addLichSuHoatDong(
          req.user._id,
          `Chỉnh sửa tài khoản ${user.user_full_name}`
        );
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

  async generatePassword(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) {
        return responseAction.error(res, 404, "Người dùng không tồn tại");
      }
      const strongPassword = generateStrongPassword(8);
      const encryptedPass = userService.encryptPassword(strongPassword);

      try {
        await mailjet.post("send", { version: "v3.1" }).request({
          Messages: [
            {
              From: {
                Email: config.MAILER_AUTH_USER,
                Name: "Hệ thống gán nhãn",
              },
              To: [
                {
                  Email: user.user_email,
                  Name: user.user_full_name,
                },
              ],
              Subject: "Cấp lại mật khẩu mới",
              TextPart: `Bạn đã được cấp lại mật khẩu mới. Vui lòng truy cập hệ thống bằng mật khẩu đã được cấp.`,
              HTMLPart: `<p>Chào ${user.user_full_name},</p>
                          <p>Bạn đã được cấp lại mật khẩu mới <strong>"${strongPassword}"</strong>.</p>
                          <p>Vui lòng truy cập hệ thống bằng mật khẩu đã được cấp.</p>
                          <p>Trân trọng,</p>
                          <p>Hệ thống gán nhãn</p>`,
            },
          ],
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { user_pass: encryptedPass, user_pass_nohash: strongPassword },
        { new: true }
      );

      return res.json(updatedUser);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  },
};
