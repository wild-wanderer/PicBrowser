
/**
 * Debug this by clicking 'Inspect views service worker' by your extension, on the extensions tab.
 */


chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: chrome.runtime.getURL("browser/PicBrowser.html") + "?url=" + tab.url });
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const urlStr = tab?.url ?? tab?.pendingUrl;
    if (!urlStr)
        return;

    let url = new URL(urlStr);
    if (url.hash !== '#background_tab') 
        return;

    url.hash = '';
    
    chrome.tabs.get(tab.openerTabId).then(parent => {
        chrome.tabs.highlight({ tabs: parent.index });
        chrome.tabs.update(tab.id, { url: url.toString() });
    });
});
