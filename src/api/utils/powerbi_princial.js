import adal from "adal-node";
const fetch = require('node-fetch');

// tenantId
//clientId
// clientSecret

// workspaceId
// reportId
export async function gettokenEmbeded(powerbi_principal) {

  let AuthenticationContext = adal.AuthenticationContext;
  let authorityUrl = `https://login.microsoftonline.com/${powerbi_principal.tenantId}/v2.0`;
  let scope = 'https://analysis.windows.net/powerbi/api'
  let context = new AuthenticationContext(authorityUrl);
  let tokenResponse = await new Promise(
    (resolve, reject) => {
      context.acquireTokenWithClientCredentials(scope, powerbi_principal.clientId, powerbi_principal.clientSecret, function (err, tokenResponse) {

        // Function returns error object in tokenResponse
        // Invalid Username will return empty tokenResponse, thus err is used
        if (err) {
          reject(tokenResponse == null ? err : tokenResponse);
        }
        resolve(tokenResponse);
      })
    }
  );

  // lấy embedUrl
  const reportInGroupApi = `https://api.powerbi.com/v1.0/myorg/groups/${powerbi_principal.workspaceId}/reports/${powerbi_principal.reportId}`;
  let headers = {
    'Content-Type': "application/json",
    'Authorization': "Bearer " + tokenResponse.accessToken
  }

  const result = await fetch(reportInGroupApi, {
    method: 'GET',
    headers: headers,
  })

  const resultJson = await result.json();


  let datasetIds = [resultJson.datasetId];

  // Add report id in the request
  let formData = {
    'reports': [{
      'id': powerbi_principal.reportId
    }]
  };

  // Add dataset ids in the request
  formData['datasets'] = [];
  for (const datasetId of datasetIds) {
    formData['datasets'].push({
      'id': datasetId
    })
  }

  // Add targetWorkspace id in the request
  if (powerbi_principal.workspaceId) {
    formData['targetWorkspaces'] = [];
    formData['targetWorkspaces'].push({
      'id': powerbi_principal.workspaceId
    })
  }
  const embedTokenApi = "https://api.powerbi.com/v1.0/myorg/GenerateToken";
  // Generate Embed token for single report, workspace, and multiple datasets. Refer https://aka.ms/MultiResourceEmbedToken
  const result1 = await fetch(embedTokenApi, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(formData)
  });
  let embedInfo = await result1.json();

  let dataRtn = {}
  dataRtn.embedUrl = resultJson.embedUrl
  dataRtn.id = resultJson.id
  dataRtn.token = embedInfo.token
  return dataRtn
}

