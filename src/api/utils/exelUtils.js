import * as XLSX from "xlsx";

export default {
  transformFile: async (filePath) => {
    let rowObj = [];
    let sheetData = [];
    const wb = XLSX.readFile(filePath, {cellDates: true});
    wb.SheetNames.forEach(function (sheetName) {
      let sheet = {
        name: sheetName,
        rows: null
      };
      rowObj = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
      sheet.rows = rowObj;
      sheetData.push(sheet)
    });
    return sheetData
  }
}