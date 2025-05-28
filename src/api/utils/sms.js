import request from "request";

const convert = require('xml-js');

export async function sendSMS(dienthoai, noidung, user) {
  return new Promise(async function (resolve, reject) {
    try {

      let xml =
          `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:impl="http://impl.bulkSms.ws/">
           <soapenv:Header/>
           <soapenv:Body>
              <impl:wsCpMt>
                 <!--Optional:-->
                 <User>smsbrand_bvpshp</User>
                 <!--Optional:-->
                 <Password>Hpg@2021</Password>
                 <!--Optional:-->
                 <CPCode>BVPSHP</CPCode>
                 <!--Optional:-->
                 <RequestID>1</RequestID>
                 <!--Optional:-->
                 <UserID>${dienthoai}</UserID>
                 <!--Optional:-->
                 <ReceiverID>${dienthoai}</ReceiverID>
                 <!--Optional:-->
                 <ServiceID>BVPSHP</ServiceID>
                 <!--Optional:-->
                 <CommandCode>bulksms</CommandCode>
                 <!--Optional:-->
                 <Content>${noidung}</Content>
                 <!--Optional:-->
                 <ContentType>1</ContentType>
              </impl:wsCpMt>
           </soapenv:Body>
        </soapenv:Envelope>`


      let options = {
        url: 'http://ams.tinnhanthuonghieu.vn:8009/bulkapi?wsdl',
        method: 'POST',
        body: xml,
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'Accept-Encoding': 'gzip,deflate',
          'Content-Length': xml.length,
           Connection: 'keep-alive',
          gzip: true,
          'Transfer-Encoding': 'chunked'
        },
      };

      let data = await sendSMSToNumberPhong(options, noidung, user)
      if(data.code === 'ErrorRequest'){
        let dataSentAgain = await sendSMSToNumberPhong(options, noidung, user)
        resolve(dataSentAgain)
      }else{
        resolve(data)
      }
    } catch (e) {
      resolve({success: false, trangthai: 0, code: 'Error', message: 'Lỗi không xác định', noidung: noidung, ...user})
    }
  })
}

async function sendSMSToNumberPhong(options, noidung, user) {
  return new Promise(function (resolve, reject) {
    request(options, async function (error, res, body) {
      if (error) {
        resolve({
          success: false,
          trangthai: 0,
          code: 'ErrorRequest',
          message: error.message ? error.message : 'Lỗi không xác định',
          noidung: noidung, ...user
        })
      } else {
        if (body) {
          let jsonResult = convert.xml2js(body, {compact: true, spaces: 4});
          let data = jsonResult['S:Envelope']['S:Body'] && jsonResult['S:Envelope']['S:Body']['ns2:wsCpMtResponse'] ? jsonResult['S:Envelope']['S:Body']['ns2:wsCpMtResponse']['return'] : null
          let data1 = jsonResult['S:Envelope']['S:Body'] && jsonResult['S:Envelope']['S:Body']['S:Fault'] ? jsonResult['S:Envelope']['S:Body']['S:Fault'] : null

          if(data1){
            let codeError = data1['faultcode']['_text'];
            let result = data1['faultstring']['_text'];
            resolve({success: false, trangthai: 0, code: codeError, message: result, noidung: noidung, ...user})
          }

          if (!data) resolve({
            success: false,
            trangthai: 0,
            code: 'Error',
            message: 'Lỗi không xác định',
            noidung: noidung, ...user
          })
          else {
            let codeError = data['message']['_text']
            let result = data['result']['_text']

            if (result === '1') {
              resolve({success: true, trangthai: 1, code: '', message: '', noidung: noidung, ...user})
            }
            let message = 'Lỗi không xác định'
            if (codeError === 'Authenticate: Cp_code: NULL_OR_BLANK') message = 'Thiếu thông tin cp_code'
            else if (codeError === 'Authenticate: UserName: NULL_OR_BLANK') message = 'Thiếu thông tin user_name'
            else if (codeError === 'Authenticate: UserName: NULL_OR_BLANK') message = 'Thiếu thông tin user_name'
            else if (codeError === 'Authenticate: UserName: NULL_OR_BLANK') message = 'Thiếu thông tin user_name'
            else if (codeError === 'CP_CODE_NOT_FOUND') message = 'Thông tin cp_code không chính xác'
            else if (codeError === 'Authenticate: WRONG_INFORMATION_AUTHENTICATE') message = 'Thông tin user/pass không chính xác'

            else if (codeError === 'Authenticate: IP_INVALID (YOUR IP: XXXX)') message = 'IP XXXX của hệ thống bạn đang gửi tin chưa được đăng ký whitelist'
            else if (codeError === 'Check RequestID: NULL_OR_BLANK') message = 'Thiếu thông tin RequestID'
            else if (codeError === 'Check RequestID: REQUEST_ID_NOT_NUMBER') message = 'RequestID không đúng'
            else if (codeError === 'Check UserID: NULL_OR_BLANK') message = 'Thiếu thông tin UserID'
            else if (codeError === 'Check ReceiverID: NULL_OR_BLANK') message = 'Thiếu thông tin ReceiverID'

            else if (codeError === 'Check ReceiverID: FORMAT_ERROR') message = 'ReceiverID không đúng'
            else if (codeError === 'UserID_NOT_EQUAL_ReceiverID') message = 'UserID và ReceiverID phải giống nhau'
            else if (codeError === 'Unable to check telco from input receiver') message = 'Không xác định được nhà mạng của thuê bao (do ReceiverID sai)'
            else if (codeError === 'Length of ReceiverID is invalid') message = 'ReceiveID không đúng (sai độ dài)'
            else if (codeError === 'Check ServiceID: DUPLICATE MESSAGE') message = 'Tin nhắn bị lặp'

            else if (codeError === 'Check ServiceID: ALIAS_INVALID:TELCO=XX') message = 'Sai thương hiệu hoặc thương hiệu chưa được khai báo cho nhà mạng tương ứng với thuê bao, XX là nhà mạng của thuê bao (VT: Viettel, VN: Vinaphone, MB: Mobiphone, VM: Vietnammobile)'
            else if (codeError === 'Check CommandCode: NULL_OR_BLANK') message = 'Thiếu thông tin command_code'
            else if (codeError === 'Check CommandCode: COMMAND_CODE_ERROR') message = 'Sai command_code'
            else if (codeError === 'Check Content: NULL_OR_BLANK') message = 'Không có nội dung tin nhắn'
            else if (codeError === 'Check Content: MAXLENGTH_LIMIT_XXXX_BYTE (YOUR_CONTENT: YY BYTE)') message = 'Độ dài tin vượt quá giới hạn (XXXX: số byte tối đa, YY là số byte nội dung tin mà bạn nhập)'

            else if (codeError === 'Check Content: MSG_ERROR_CONTAIN_BLACKLIST') message = 'Nội dung chứa từ ngữ bị chặn'
            else if (codeError === 'Check information error') message = 'Lỗi chung hệ thống'
            else if (codeError === 'Check template: CONTENT_NOT_MATCH_TEMPLATE') message = 'Lỗi sai định dạng mẫu tin nhắn'

            resolve({success: false, trangthai: 0, code: codeError, message: message, noidung: noidung, ...user})
          }

        } else {
          resolve({
            success: false,
            trangthai: 0,
            code: 'Error',
            message: 'Lỗi không xác định',
            noidung: noidung, ...user
          })
        }
      }
    });
  })
}