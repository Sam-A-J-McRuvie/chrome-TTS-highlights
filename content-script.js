/*
    Url:https://stackoverflow.com/questions/70534844/getting-all-the-involved-nodes-of-a-selection-in-javascript
    "I've spent a day and a half on this 
    (it's over a hundred lines of code in three separate functions);
    each time I think I'm done I find another edge case that break the whole thing. 
    Attempts to refactor are a mess. 
    Adding to this, it's not clear which end is inclusive" 
    – Michael November 20, 2022 at 3:17, StackOverflow

    "We choose to go to the Moon in this decade and do the other things, 
    not because they are easy, but because they are hard." 
    - JFK September 12, 1962, Rice University, Houston, Texas
*/

console.log(`content-script:loaded at:${new Date().toLocaleTimeString()}`);

const highlighter = new Highlighter();

let textNodesObj = {
    textNodes: [],
    index: 0,
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.type) {
        case "selected":
            console.log(`received message: selected`);
            const selection = window.getSelection();
            const selectedRange = selection.getRangeAt(0);
            textNodesObj.textNodes = Highlighter.parseTextNodes(selectedRange);
            textNodesObj.index = 0;
            if (textNodesObj.textNodes.length > 0) {
                chrome.runtime.sendMessage({
                    type: "read",
                    utterance:
                        textNodesObj.textNodes[textNodesObj.index].textContent,
                });
            }
            selection.removeAllRanges();
            break;
        case "word":
            console.log(
                `received message: word event:${message.charIndex}:${message.wordLength}`
            );
            const textNode = textNodesObj.textNodes[textNodesObj.index];
            const range = new Range();
            range.setStart(textNode, message.charIndex);
            range.setEnd(textNode, message.charIndex + message.wordLength);
            highlighter.setHighlight(range);
            break;
        case "end":
            console.log(`received message:end event`);
            if (textNodesObj.index < textNodesObj.textNodes.length - 1) {
                textNodesObj.index++;
                chrome.runtime.sendMessage({
                    type: "read",
                    utterance:
                        textNodesObj.textNodes[textNodesObj.index].textContent,
                });
            } else {
                highlighter.removeHighlight();
            }
            break;
        case "test":
            console.log(`received message:test event`);
            break;
        default: // p3 handel tts stop, pause and resume events. If any issue occurs clear the highlights. can just use default case
            throw new Error(`unknown message:${message}`);
    }
});
