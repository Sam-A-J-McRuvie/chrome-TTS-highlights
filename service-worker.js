const context = 'service-worker';
console.log(`${context}:loaded at:${new Date().toLocaleTimeString()}`); 

// p4 https://groups.google.com/a/chromium.org/g/chromium-extensions/c/BmOlm2Vg7aM

// word event, start and end index of word
// https://developer.chrome.com/docs/extensions/reference/api/tts#type-EventType
// p1 implement TTS API
chrome.runtime.onInstalled.addListener(() => { // 
    chrome.contextMenus.create({
        id: "selected",
        title: "Read selected text", 
        contexts:["selection"], 
    });
    chrome.contextMenus.create({
        id: "test",
        title: "Test", 
        contexts:["page"], 
    });
});

chrome.contextMenus.onClicked.addListener((info) => {
    chrome.tabs.query({active : true, lastFocusedWindow : true}, function (tabs) {
        var tab = tabs[0];
        var url = tab.url;
        if (info.menuItemId === 'selected') {
            chrome.tabs.sendMessage(tab.id, {message: "selected"});
        }else if(info.menuItemId === 'test'){
            chrome.tabs.sendMessage(tab.id, {message: "test"});
        }
    });
  })

