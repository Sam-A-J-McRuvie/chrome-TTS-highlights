const context = "service-worker";
console.log(`${context}:loaded at:${new Date().toLocaleTimeString()}`);

// p4 https://groups.google.com/a/chromium.org/g/chromium-extensions/c/BmOlm2Vg7aM

// word event, start and end index of word
// https://developer.chrome.com/docs/extensions/reference/api/tts#type-EventType

// p1 implement TTS API
chrome.runtime.onInstalled.addListener(() => {
    //
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
    console.log(`service-worker:received message:${request.type}`);
    const tab = sender.tab.id
    switch (request.type) {
        case "read":
        chrome.tts.speak(
            request.utterance,
            { rate: 0.8 },
            {
                onEvent: function (event) {
                    switch (message.type) {
                        case "start":
                            console.log("Started speaking");
                            break;
                        case "word":
                            chrome.tabs.sendMessage(tab, { type: "test",  charIndex: event.charIndex, charLength: event.charLength });
                            console.log(
                                `Word event: ${event.charIndex} to ${
                                    event.charIndex + event.charLength
                                }`
                            );
                            break;
                        case "end":
                            console.log("Finished speaking");

                            break;
                        case "error":
                            console.log("Error: " + event.errorMessage);

                            break;
                        default:
                            throw new Error(
                                `unknown message:${message.message}`
                            );
                    }
                },
            }
        );
        break;
    }
});
