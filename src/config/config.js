// const DEFAULT_DB_URI = "mongodb://localhost:27017/app";
// const DEFAULT_DB_URI = "mongodb+srv://admin:admin123@cluster0.1ykgya9.mongodb.net/qlhs";
const DEFAULT_DB_URI = "mongodb://root:root1234@ailabs.ddns.net:27017/label_api?connectTimeoutMS=10000&authSource=admin&authMechanism=SCRAM-SHA-256";

const config = {
  development: {
    secret: 'MY APP',
    MONGO_URI: process.env.MONGO_URI || DEFAULT_DB_URI,
    port: process.env.PORT,
    "mail": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "ailabs@ailabs.io.vn",
        "pass": "Ailabs@123"
      }
    },
  }
};

export const getConfig = env => config[env] || config.development;
