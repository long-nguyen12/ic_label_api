import carbone from 'carbone'
import {getFilePath, getDirPath} from '../utils/fileUtils'


export function generateDocument(res, data, fileNameIn, fineNameOut) {
  let opt = {
    renderPrefix: 'bao_cao',
    reportName: 'Báo cáo',
    timezone: 'Asia/Saigon',
  };

  const templateFilePath = getFilePath(fileNameIn, getDirPath('templates', './src'));
  carbone.render(templateFilePath, data, opt, async function (err, resultFilePath) {
    try {
      res.download(resultFilePath, fineNameOut);
    } catch (err) {
      console.log('Không tải được tập tin!');
      return res.status(400).send(err);
    }
  });
}