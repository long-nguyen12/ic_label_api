import request from 'request';

import { getConfig } from '../../config/config';
const config = getConfig(process.env.NODE_ENV);

const powerbi = config.powerbi

const client_id = powerbi.client_id;
const client_secret = powerbi.client_secret;
const reportId = powerbi.reportId;
const groupId = powerbi.groupId;

const grant_type = "password";
const resource = "https://analysis.windows.net/powerbi/api";
const scope = "openid";
const username = "dung@thinklabs.com.vn";
const password = "TL@36Admin";
const url_get_token = "https://login.microsoftonline.com/common/oauth2/token";
const url = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}/generatetoken`

async function loginByAccountFunc() {
  return new Promise(function (resolve, reject) {
    try {

      const options = {
        method: "POST",
        url: url_get_token,
        formData: {
          client_id: client_id,
          client_secret: client_secret,
          grant_type: grant_type,
          resource: resource,
          scope: scope,
          username: username,
          password: password
        }
      };

      request(options, function (error, res, body) {
        if (error) {

          resolve({success: false})
        } else {
          if(body){
            resolve(JSON.parse(body))
          }else{
            resolve({success: false})
          }
        }
      });

    } catch (e) {
      resolve({success: false})
    }
  })
}

async function gettoken() {
  let token_data = await loginByAccountFunc()
  if (!token_data)
    return {success: false}
  return new Promise(function (resolve, reject) {
    try {
      const options = {
        method: "POST",
        url: url,
        headers: {
          "Authorization": "Bearer " + token_data.access_token,
          "Content-Type": "application/json",
        },
        json: {
          "accessLevel": "View",
          "allowSaveAs": "false"
        }
      };

      request(options, function (error, res, body) {
        if (error) {
          resolve({success: false})
        } else {
          resolve({token: body.token, reportId: reportId, groupId: groupId})
        }
      });

    } catch (e) {
      resolve({success: false})
    }
  })
}


export {
  loginByAccountFunc,
  gettoken
};
