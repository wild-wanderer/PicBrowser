
/**
 * Debug this by clicking 'Inspect views service worker' by your extension, on the extensions tab.
 */


chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: chrome.runtime.getURL("browser/PicBrowser.html") + "?url=" + tab.url });
});
