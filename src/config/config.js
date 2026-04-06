const DEFAULT_DB_URI = ``;

const baseConfig = {
  secret: process.env.JWT_SECRET || process.env.JWT_PRIVATE_KEY || "MY APP",
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
  host_admin: process.env.HOST_ADMIN || "",
  host_api_image: process.env.HOST_API_IMAGE || "",
  api_sync_valid: {
    username: process.env.API_SYNC_USERNAME || "",
    password: process.env.API_SYNC_PASSWORD || "",
  },
  mail: {
    auth: {
      user: process.env.MAILER_AUTH_USER || "",
      pass: process.env.MAILER_AUTH_PASS || "",
    },
    host: process.env.MAILER_SERVER || "smtp.gmail.com",
    port: process.env.MAILER_PORT || 587,
  },
  powerbi: {
    client_id: process.env.POWERBI_CLIENT_ID || "",
    client_secret: process.env.POWERBI_CLIENT_SECRET || "",
    reportId: process.env.POWERBI_REPORT_ID || "",
    groupId: process.env.POWERBI_GROUP_ID || "",
    username: process.env.POWERBI_USERNAME || "",
    password: process.env.POWERBI_PASSWORD || "",
  },
};

const config = {
  development: baseConfig,
  production: baseConfig,
  test: baseConfig,
};

export const getConfig = (env) => config[env] || config.development;
