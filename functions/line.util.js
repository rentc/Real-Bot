const functions = require("firebase-functions");
const crypto = require('crypto');
const axios = require("axios");

const LINE_MESSAGING_API = process.env.LINE_MESSAGING_API;
const LINE_DATA_MESSAGING_API = process.env.LINE_DATA_MESSAGING_API;


const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

const LINE_HEADER = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
};
const LINE_DATA_HEADER = {
  "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
};


exports.getContent = async (message) => {


  let url = `${LINE_DATA_MESSAGING_API}/message/${message.id}/content`

  if (message.contentProvider.type === 'external') {
    url = message.contentProvider.originalContentUrl;
  }

  const response = await axios({
    method: 'get',
    headers: LINE_DATA_HEADER,
    url: url,
    responseType: 'arraybuffer',
  });
  return response
};


exports.reply = (token, payload) => {
  return axios({
    method: "post",
    url: `${LINE_MESSAGING_API}/message/reply`,
    headers: LINE_HEADER,
    data: JSON.stringify({
      replyToken: token,
      messages: payload
    })
  });
};

exports.getGroupMemberProfile = async (groupId, userId) => {
  try {
    const response = await axios({
      method: "get",
      url: `${LINE_MESSAGING_API}/group/${groupId}/member/${userId}`,
      headers: {
        "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      }
    });
    return response.data;
  } catch (error) {
    functions.logger.error("Failed to fetch group member profile:", error);
    return null;
  }
};

exports.verifySignature = (originalSignature, body) => {
  if (!originalSignature) {
    functions.logger.error("Missing x-line-signature header");
    return false;
  }

  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  let rawBody = body;

  if (typeof body === 'object' && !Buffer.isBuffer(body)) {
    rawBody = JSON.stringify(body);
  }

  const signature = crypto
    .createHmac("SHA256", channelSecret)
    .update(rawBody)
    .digest("base64");

  if (signature !== originalSignature) {
    functions.logger.error("Unauthorized: Signature mismatch");
    return false;
  }
  return true;
};