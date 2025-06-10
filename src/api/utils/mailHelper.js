import nodemailer from "nodemailer";
import { getConfig } from "../../config/config";
const config = getConfig(process.env.NODE_ENV);

import {
  //   MAILER_AUTH_PASS,
  //   MAILER_AUTH_USER,
  MAILER_PORT,
  MAILER_SERVER,
  POST_MARK_MAIL_SERVICE_TOKEN,
} from "../../config/config";

// export async function sendEmail(mailOptions) {
//   try {
//     let transporter = nodemailer.createTransport(config.mail);
//     let info = await transporter.sendMail(mailOptions);
//     return info;
//   } catch (e) {
//     console.error(e);
//     throw e;
//   }
// }

export const transporter = nodemailer.createTransport({
  host: MAILER_SERVER,
  port: MAILER_PORT || 2525,
  secure: false,
  auth: {
    user: POST_MARK_MAIL_SERVICE_TOKEN,
    pass: POST_MARK_MAIL_SERVICE_TOKEN,
  },
});
