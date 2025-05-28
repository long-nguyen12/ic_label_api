import * as fileUtils from "../../utils/fileUtils";
import fs from "fs";
import path from "path";

var sizeOf = require("image-size");
const sharp = require("sharp");

const osTempDir = require("os").tmpdir();
const tempDir = osTempDir + "\\uploads";

export default {

    async getFileByName(req, res) {
        let fileNm = req.params.fileNm;
        return res.sendFile(path.join(process.cwd(), './uploads/files/' + fileNm));
    },

    async getImageByName(req, res) {
        let imgNm = req.params.imgNm;
        return res.sendFile(path.join(process.cwd(), './uploads/images/' + imgNm));
    },

    findFileById(req, res) {
        return res.redirect(fileUtils.getUrlFileAPI(req.params.id));
    },

    // download files
    downloadFile(req, res) {
        return res.redirect(fileUtils.getUrlFileAPI(req.params.id, false));
    },

    downloadFileHisSync(req, res) {
        let fileNm = req.query.fileNm;
        return res.redirect(fileUtils.getUrlFileAPIHisSync(fileNm));
    },

    async uploadImages(req, res) {
        try {
            // let image = req.file && req.file.file ? req.file.file : '';
            let image = req.file;
            if (!image) {
                return res.status(404).send({
                    success: false,
                    message: "Dữ liệu của ảnh tải lên không tồn tại.",
                });
            }

            let originalFilename = image.originalname;
            const pathOriginal = req.file.path;

            if (!originalFilename.match(/\.(jpg|png|jpeg|gif|JPG|PNG|JPEG)$/)) {
                fs.unlink(pathOriginal, (err) => {
                    if (err) {
                        console.log("err", err);
                        throw err;
                    }
                });
                return res.status(400).json({
                    success: false,
                    message: "Tệp tin tải lên không đúng định dạng ảnh.",
                });
            }

            let properties = sizeOf(pathOriginal);
            const imageHeight = properties.height;
            let fileNmStore = fileUtils.convertFileName(originalFilename);
            let pathImageResize = "./uploads/images/" + fileNmStore;

            await sharp(pathOriginal)
                .rotate()
                .resize(null, imageHeight > 960 ? 960 : null)
                .toFile(pathImageResize)
                .then(async (new_file_info) => {
                    fs.unlink(pathOriginal, (err) => {
                        if (err) {
                            console.log("err", err);
                            throw err;
                        }
                    });

                    return res.json({ file_id: fileNmStore });
                })
                .catch(function (err) {
                    console.error(err);
                    return res.status(404).json({
                        success: false,
                        message:
                            "Không thể tải ảnh lên, vui lòng kiểm tra và thử lại",
                    });
                });
        } catch (err) {
            console.error(err);
            return res.status(500).send(err);
        }
    },

    // upload files
    async uploadFiles(req, res) {
        try {
            let image = req.files && req.files.image ? req.files.image : "";
            if (!image) {
                return res.status(404).send({
                    success: false,
                    message: "Dữ liệu của ảnh tải lên không tồn tại.",
                });
            }
            let originalFilename = image.originalFilename;
            const pathOriginal = req.files.image.path;
            if (
                !originalFilename.match(
                    /\.(doc|docx|xls|xlsx|excel|pdf|DOC|DOCX|XLS|XLSX|EXCEL|PDF)$/
                )
            ) {
                fs.unlink(pathOriginal, (err) => {
                    if (err) {
                        console.log("err", err);
                        throw err;
                    }
                });
                return res.status(400).json({
                    success: false,
                    message: "Tệp tin tải lên không đúng định dạng file.",
                });
            }

            let fileNmStore = fileUtils.convertFileName(originalFilename);
            let pathFileNmStore = tempDir + "\\" + fileNmStore;
            await fileUtils.renameFileUploads(pathOriginal, pathFileNmStore);

            let imageDetail = await fileUtils.sendImageFile(
                pathFileNmStore,
                false
            );
            if (!imageDetail) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Không thể tải file lên, vui lòng kiểm tra và thử lại",
                });
            }
            return res
                .status(200)
                .send({ success: true, file_id: imageDetail.filename });
        } catch (err) {
            console.error("err", err);
            return res.status(500).send(err);
        }
    },
};
