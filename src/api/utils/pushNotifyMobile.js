import Expo from 'expo-server-sdk';
import DeviceToken from '../resources/thongtinchung/devicetoken.model';
import BenhNhan from '../resources/benhnhan/benhnhan.model';
import Tintuc from '../resources/tintucyte/tintuc/tintuc.model';
import HuongDan from '../resources/huongdanbenhnhan/huongdan/huongdan.model';
// loaithongbao = 'TinTuc' thì chạy đến chi tiết tin tức
// loaithongbao = 'HuongDan' thì chạy đến chi tiết hướng dẫn
// else  thì chạy đến lịch sử khám bệnh (như hiện tại)
export async function pushNotifyMobile(data) {
  let expo = new Expo();
  let messages = [];
  // 1 Tin tức, 2 Hướng dẫn
  let dataThongBao = null
  let txtTitle = ''
  if(data.loaithongbao === 'TinTuc'){
    txtTitle = 'Tin tức'
    dataThongBao = await Tintuc.findById(data.link_push_id, 'tieude').lean()
  }else if(data.loaithongbao === 'HuongDan'){
    txtTitle = 'Hướng dẫn'
    dataThongBao = await HuongDan.findById(data.link_push_id, 'tieude').lean()
  }

  if(!dataThongBao) return null
  // lấy danh sách token
  let pushMobile = await DeviceToken.find({}).lean().distinct('device_token');
  let tokenDel = []
  for (let pushToken of pushMobile) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      //console.error(`Push token ${pushToken} is not a valid Expo push token`);
      tokenDel.push(pushToken)
      continue;
    }

    // Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
    messages.push({
      to: pushToken,
      title: txtTitle,
      body: dataThongBao.tieude,
      data: {_id: dataThongBao._id, loaithongbao: data.loaithongbao},
      sound: 'default',
      channelId: 'notification'
    })
  }

  // The Expo push notification service accepts batches of notifications so

  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  let chunkSend = [];
  await (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);

        chunkSend.push(...chunk);
        tickets.push(...ticketChunk);

        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
      } catch (error) {
        if (error.code === 'PUSH_TOO_MANY_EXPERIENCE_IDS') {
          let objPush = {
            // to: pushToken,
            title: txtTitle,
            body: dataThongBao.tieude,
            data: {_id: dataThongBao._id, loaithongbao: data.loaithongbao},
            sound: 'default',
            channelId: 'notification'
          }

          let details = error.details;
          for (const property in details) {
            await pushNotifyMobileMultiIDS(details[property], objPush);
          }

        }
      }
    }
    return tickets
  })();
  for (let i=0; i<tickets.length; i++) {
    let ticket = tickets[i]
    if(!ticket.id && chunkSend[i] && chunkSend[i]['to']){
      tokenDel.push(chunkSend[i]['to']);
    }
  }
  if(tokenDel.length){
    // xóa token gửi lỗi.
    await DeviceToken.deleteMany({device: {$in : tokenDel}})
  }
}

async function pushNotifyMobileMultiIDS(arrToken, objPush){
  let expo = new Expo();
  let messages = []
  arrToken.forEach(pushToken => {
    objPush.to = pushToken
    messages.push(objPush)
  })

  // The Expo push notification service accepts batches of notifications so

  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  let chunkSend = [];
  await (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);

        chunkSend.push(...chunk);
        tickets.push(...ticketChunk);

        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
      } catch (error) {
      }
    }
    return tickets
  })();

}

export async function pushMobileToPatient(data, device_tokens, pushCount, typePush) {
  let expo = new Expo();
  let messages = [];

  // danh sách token: device_tokens.
  // data là dữ liệu push notify
  let tokenDel = [];
  for (let pushToken of device_tokens) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      //console.error(`Push token ${pushToken} is not a valid Expo push token`);
      tokenDel.push(pushToken);
      continue;
    }

    // Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
    messages.push({
      to: pushToken,
      title: data.tieude,
      body: data.noidung,
      data: {
        _id: data._id,
        type: typePush,
        push_link_id: data.push_link_id,
        loaithongbao_id: data.loaithongbao_id,
        tab_id: data.tab_id
      },
      sound: 'default',
      badge: pushCount,
      channelId: 'notification'
    })
  }

  // The Expo push notification service accepts batches of notifications so

  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  let chunkSend = [];
  await (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);

        chunkSend.push(...chunk);
        tickets.push(...ticketChunk);

        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
      } catch (error) {
        console.error(error);
        if (error.code === 'PUSH_TOO_MANY_EXPERIENCE_IDS') {
          let objPush = {
            title: data.tieude,
            body: data.noidung,
            data: {
              _id: data._id,
              type: typePush,
              push_link_id: data.push_link_id,
              loaithongbao_id: data.loaithongbao_id,
              tab_id: data.tab_id
            },
            sound: 'default',
            badge: pushCount,
            channelId: 'notification'
          }

          let details = error.details;
          for (const property in details) {
            await pushNotifyMobileMultiIDS(details[property], objPush);
          }

        }
      }
    }
    return tickets
  })();
  for (let i=0; i<tickets.length; i++) {
    let ticket = tickets[i]
    if(!ticket.id && chunkSend[i] && chunkSend[i]['to']){
      tokenDel.push(chunkSend[i]['to']);
    }
  }
  if(tokenDel.length){
    // xóa token gửi lỗi.
    let device_tokens_new = device_tokens.filter(tokens => {
      return tokenDel.indexOf(tokens) === -1
    })
    await BenhNhan.findByIdAndUpdate(data.citizen_id, {device_tokens: device_tokens_new}, { new: true })
  }
}
