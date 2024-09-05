const context = 'service-worker';
console.log(`${context}:loaded at:${new Date().toLocaleTimeString()}`); 

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "readSelectedText",
        title: "Read selected text", 
        contexts:["selection"], 
    });
    chrome.contextMenus.create({
        id: "nextWord",
        title: "Next word", 
        contexts:["page"], 
    });
});

chrome.contextMenus.onClicked.addListener((info) => {
    chrome.tabs.query({active : true, lastFocusedWindow : true}, function (tabs) {
        var tab = tabs[0];
        var url = tab.url;
        if (info.menuItemId === 'readSelectedText') {
            console.log(`${context}:read selected text from:${url}`);
            chrome.tabs.sendMessage(tab.id, {message: "startReading"});
        }else if(info.menuItemId === 'nextWord'){
            chrome.tabs.sendMessage(tab.id, {message: "nextWord"});
        }
    });
  })
