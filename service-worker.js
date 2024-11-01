const context = "service-worker";
console.log(`${context}:loaded at:${new Date().toLocaleTimeString()}`);

// p4 https://groups.google.com/a/chromium.org/g/chromium-extensions/c/BmOlm2Vg7aM

// word event, start and end index of word
// https://developer.chrome.com/docs/extensions/reference/api/tts#type-EventType

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "selected",
        title: "Read selected text",
        contexts: ["selection"],
    });
    chrome.contextMenus.create({
        id: "test",
        title: "Test",
        contexts: ["page"],
    });
});
// context menu click event
chrome.contextMenus.onClicked.addListener((info) => {
    chrome.tabs.query(
        { active: true, lastFocusedWindow: true },
        function (tabs) {
            var tab = tabs[0];
            var url = tab.url;
            if (info.menuItemId === "selected") {
                chrome.tabs.sendMessage(tab.id, { type: "selected" });
            } else if (info.menuItemId === "test") {
            }
        }
    );
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(`received message:${request.type}`);
    const tab = sender.tab;
    switch (request.type) {
        case "read":
            chrome.tts.speak(request.utterance, {
                voiceName: "Microsoft George - English (United Kingdom)",
                rate: 10, 
                lang: 'en-GB',
                onEvent: (event) => eventHandlerChromeTTS(event, tab),
            });
            break;
    }
});
// p1 need tts voice that allows for word events
function eventHandlerChromeTTS(event, tab) {
    console.log(`TTS event:${event.type}`);
    chrome.tabs.get(tab.id).then((tab) => { 
        switch (event.type) {
            case "word":
                chrome.tabs.sendMessage(tab.id, { type: "word" , charIndex: event.charIndex, wordLength: event.length});
                break;
            case "end":
                chrome.tabs.sendMessage(tab.id, { type: "end"});
                break;
            default:
                console.log(`unknown event:${event.type}`);
        }
    });
}
