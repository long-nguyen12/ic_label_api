import nodemailer from "nodemailer";
import { getConfig } from "../../config/config";
const config = getConfig(process.env.NODE_ENV);

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

const authUser = config.POST_MARK_MAIL_SERVICE_TOKEN || config.MAILER_AUTH_USER;
const authPass = config.POST_MARK_MAIL_SERVICE_TOKEN || config.MAILER_AUTH_PASS;

export const transporter = nodemailer.createTransport({
  host: config.MAILER_SERVER,
  port: Number(config.MAILER_PORT) || 2525,
  secure: false,
  auth: authUser
    ? {
        user: authUser,
        pass: authPass,
      }
    : undefined,
});
