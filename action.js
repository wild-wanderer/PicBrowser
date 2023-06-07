
chrome.action.onClicked.addListener((tab) => {
    
    chrome.tabs.create({ url: chrome.runtime.getURL("browser/PicBrowser.html") + "?url=" + tab.url });
    
});