import carbone from "carbone";

export async function renderDataToFileTemp(templateFilePath, data) {
    let opt = {
      renderPrefix: 'bao_cao',
      reportName: 'Báo cáo',
      timezone: 'Asia/Saigon',
    };
    return new Promise((resolve, reject) => {
      carbone.render(templateFilePath, data, opt, function(err, resultFilePath) {
        if (err) return reject(err);
        resolve(resultFilePath);
      });
    });
  }