const DEFAULT_DB_URI = ``;

const config = {
  development: {
    secret: 'MY APP',
    MONGO_URI: process.env.MONGO_URI || DEFAULT_DB_URI,
    port: process.env.PORT,
    MAILER_AUTH_USER: process.env.MAILER_AUTH_USER || "",
    MAILER_AUTH_PASS: process.env.MAILER_AUTH_PASS || "",
    MAILER_SERVER: process.env.MAILER_SERVER || "smtp.gmail.com",
    MAILER_PORT: process.env.MAILER_PORT || 587,
    MAILJET_API_KEY: process.env.MAILJET_API_KEY || "",
    MAILJET_SECRET_KEY: process.env.MAILJET_SECRET_KEY || "",
    ResendAPIKey: process.env.MAIL_SERVICE_KEY || "",
    JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY || "",
    POST_MARK_MAIL_SERVICE_TOKEN: process.env.POST_MARK_MAIL_SERVICE_TOKEN || "",
  }
};

export const getConfig = env => config[env] || config.development;