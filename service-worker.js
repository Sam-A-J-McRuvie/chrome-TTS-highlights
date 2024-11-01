console.log(`service-worker:loaded at:${new Date().toLocaleTimeString()}`);
// p4 settings menu for tts voice and rate. Need list of available voices
chrome.runtime.onInstalled.addListener(() => {
    // p2 create context for stop, pause and resume
    chrome.contextMenus.create({
        id: "selected",
        title: "Read selected text",
        contexts: ["selection"],
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
                lang: "en-GB",
                onEvent: (event) => eventHandlerChromeTTS(event, tab),
            });
            break;
    }
});


// p1 handel interrupt, stop, pause and resume events
// p5 handel on voice change event
function eventHandlerChromeTTS(event, tab) {
    console.log(`TTS event:${event.type}`);
    chrome.tabs.get(tab.id).then((tab) => {
        switch (event.type) {
            case "word":
                chrome.tabs.sendMessage(tab.id, {
                    type: "word",
                    charIndex: event.charIndex,
                    wordLength: event.length,
                });
                break;
            case "end":
                chrome.tabs.sendMessage(tab.id, { type: "end" });
                break;
            default:
                console.log(`unknown event:${event.type}`);
        }
    });
}
