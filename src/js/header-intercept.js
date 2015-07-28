chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
    details.requestHeaders.push({
        name: 'Testing',
        value: 'hello'
    });
    return { requestHeaders: details.requestHeaders };
}, {
    urls: ["<all_urls>"]
}, ['requestHeaders', 'blocking']);
