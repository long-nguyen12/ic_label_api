import fs from 'fs';
import multipart from 'connect-multiparty';
import path from 'path';
import {getConfig} from '../../config/config';
import request from 'request';

const osTempDir = require('os').tmpdir();
const tempDir = './uploads';
const filesDir = path.resolve('./storage');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}


export const getDirPath = (dirName, rootPath = './storage') => {
  const dirPath = path.resolve(rootPath, dirName);
  createFolderIfNotExist(dirPath);
  return dirPath;
};

function createFolderIfNotExist(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }
}

function createIfNotExistFolders() {
  createFolderIfNotExist(tempDir);
  createFolderIfNotExist(filesDir);
  const filesTemplatesDir = getDirPath('templates');
  createFolderIfNotExist(filesTemplatesDir);
}


export const getFilePath = (fileName, filesDir = './storage') => {
  return path.join(filesDir, fileName);
};

const config = getConfig(process.env.NODE_ENV);
const multipartMiddleware = multipart({uploadDir: tempDir});

const checkTempFolder = (req, res, next) => {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
    createIfNotExistFolders()
  }
  next();
};

const prepareTempFolder = () => {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  clearFolder(tempDir);
};

const clearFolder = (tempDir) => {
  fs.readdir(tempDir, (err, files) => {
    if (err) {
      console.log(err);
      return;
    }
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), err => {
        if (err) {
          console.log(file, err);
        }
      });
    }
  });
};

const getFileExtension = (filename) => {
  let ext = /^.+\.([^.]+)$/.exec(filename);
  return ext === null ? '' : ext[1];
};

function formatFileName(str) {
  if (!str) return;
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  str = str.replace(/\s+/g, '_');
  return str;
}

function convertFileName(fileNm) {
  let extension = path.extname(fileNm);
  let fileWithoutExtension = formatFileName(path.basename(fileNm, extension));
  let date_val = new Date();
  let timestam = date_val.getTime();
  let fileStorage = fileWithoutExtension + '_' + timestam + extension;
  return fileStorage
}

export function renameFileUploads(pathOriginal, pathFileNmStore) {
  return new Promise(function (resolve, reject) {
    fs.rename(pathOriginal, pathFileNmStore, function (err) {
      if (!err) {
        resolve({success: true});
      } else {
        reject({success: false});
      }

    });
  });
}

const sendImageFile = (pathImageResize, isImage = true) => {
  return new Promise(function (resolve, reject) {
    let host_api_image = config.host_api_image + (isImage ? '' : '/files');
    const options = {
      method: "POST",
      url: host_api_image,
      headers: {
        "Content-Type": "multipart/form-data"
      },
      formData: {
        "image": fs.createReadStream(pathImageResize)
      }
    };
    request(options, function (error, res, body) {
      fs.unlink(pathImageResize, (err) => {
        if (err) {
          console.log('err', err);
          throw err;
        }
      });
      if (!error && res.statusCode === 200) {
        resolve(JSON.parse(body));
      } else {
        reject({success: false});
      }
    });
  });
};

const getUrlFileAPI = (fileName, isImage = true) => {
  let host_api_image = config.host_api_image + (isImage ? '' : '/files');
  return host_api_image + '/' + fileName
};

const getUrlFileAPIHisSync = (fileName) => {
  let host_api_image = config.host_api_image + '/hissync?fileNm=';
  console.log(host_api_image + fileName, '1')
  return host_api_image + fileName
};

export {
  multipartMiddleware,
  getFileExtension,
  prepareTempFolder,
  checkTempFolder,
  formatFileName,
  convertFileName,
  sendImageFile,
  getUrlFileAPI,
  getUrlFileAPIHisSync
};
