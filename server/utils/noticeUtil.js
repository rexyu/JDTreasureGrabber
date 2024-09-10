const { getUserDataProperty } = require("./storeUtil");
const http = require('http');
const Constants = require("../../constant/constants");
const tls = require('tls');
const https = require("https");
const consoleUtil = require('./consoleLogUtil');
const { Notification } = require('electron');
const noticeTitle = "京东夺宝岛助手提示";

function sendNotice(msg, telMsg) {

    consoleUtil.log("sendNotice msg = ", msg);

    const userDataOptions = getUserDataProperty(Constants.StoreKeys.OPTIONS_KEY);
    const {enableDing, dingBotWebhook, enableTel, telBotToken, telChatId, enableDesktopNotification } = userDataOptions || {};

    if (enableDesktopNotification || undefined === enableDesktopNotification) {
        new Notification({ title: noticeTitle, body: msg }).show();
    }

    if (telMsg && enableTel && telBotToken && telChatId) {
        // 发送电报消息
        sendTelMsg(telBotToken, telChatId, telMsg, userDataOptions)
            .catch((e) => { consoleUtil.log("sendTelMsg error = ", e); });
    }
    if (telMsg && enableDing && dingBotWebhook ) {
        // 发送dingding消息
        sendDingMsg(dingBotWebhook, telMsg)
            .catch((e) => { consoleUtil.log("sendTelMsg error = ", e); });
    }
}

/**
 * 发送电报消息
 */
function sendTelMsg(botToken, chatId, msg, userDataOptions) {
    const { enableHttpProxy, proxyHost, proxyPort, proxyUserName, proxyPassword } = userDataOptions;
    return new Promise((resolve, reject) => {
        const options = {
            hostname: "api.telegram.org",
            port: 443,
            path: `/bot${botToken}/sendMessage`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const postData = JSON.stringify({ chat_id: chatId, text: msg });

        if (enableHttpProxy && proxyHost && proxyPort) {
            const proxyHeaders = {};
            if (proxyUserName && proxyPassword) {
                proxyHeaders['Proxy-Authorization'] = 'Basic ' + Buffer.from(proxyUserName + ':' + proxyPassword).toString('base64');
            }
            http.request({
                host: proxyHost,
                port: proxyPort,
                method: 'CONNECT',
                path: `api.telegram.org:443`,
                headers: proxyHeaders,
            }).on('connect', (res, socket) => {
                if (res.statusCode === 200) {
                    // connected to proxy server
                    options.agent = new https.Agent({ socket });
                    postTelRequest(options, postData, resolve, reject);
                } else {
                    reject("代理服务器连接失败");
                }
            }).on('error', (err) => {
                consoleUtil.error(`sendTelMsg 代理请求遇到问题: ${err.message}`);
                reject(err);
            }).end();

        } else {
            postTelRequest(options, postData, resolve, reject);
        }
    });
}

/**
 * 发起telgram发送消息请求
 */
function postTelRequest(options, postData, resolve, reject) {
    const req = https.request(options, (res) => {
        let rawData = "";

        res.setEncoding('utf8');

        res.on('data', (chunk) => {
            rawData += chunk;
        });

        res.on('end', () => {
            // const parsedData = JSON.parse(rawData);
            // consoleUtil.log("sendTelMsg end parsedData = ", parsedData);
            resolve();
        });
    });

    req.on('error', (e) => {
        consoleUtil.error(`sendTelMsg 请求遇到问题: ${e.message}`);
        reject(e);
    });

    req.write(postData);
    req.end();
}


/**
 * 发送ding消息
 * https://oapi.dingtalk.com/robot/send?access_token=4a0bda82a2c3a937a10842d4cca8fd7058211aceac82e0c4301a363599584ae9
 */
function sendDingMsg(dingBotWebhook, msg) {
    
    return new Promise((resolve, reject) => {

        // 创建一个自定义的 https.Agent
        const agent = new https.Agent({
        rejectUnauthorized: false
        });

        options.agent=agent;
        options.method='POST';
        options.headers={
            'Content-Type': 'application/json'
        }

        const options2 = {
        hostname: 'oapi.dingtalk.com',  // 替换为你的目标主机名
        port: 443,
        path: `/robot/send?access_token=${dingBotWebhook}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        agent: agent  // 使用自定义的 https.Agent
        };


        msg = msg.replace(/\t/g,'');

        const postData = JSON.stringify({ 
            "msgtype": "text", 
            "text": {
                "content": msg
                } 
        });
        postDingRequest(options2, postData, resolve, reject);
    });

}

/**
 * 发起telgram发送消息请求
 */
function postDingRequest(options, postData, resolve, reject) {
    const req = https.request(options, (res) => {
        let rawData = "";

        res.setEncoding('utf8');

        res.on('data', (chunk) => {
            rawData += chunk;
        });

        res.on('end', () => {
             const parsedData = JSON.parse(rawData);
             consoleUtil.log("sendTelMsg end parsedData = ", parsedData);
            resolve();
        });
    });

    req.on('error', (e) => {
        consoleUtil.error(`sendDingMsg 请求遇到问题: ${e.message}`);
        reject(e);
    });

    req.write(postData);
    req.end();
}


module.exports = { sendNotice };
