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
const context = 'content-script';
console.log(`${context}:loaded at:${new Date().toLocaleTimeString()}`); 
// TODO: Handle request from background script, to read the selected text
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.message) {
        case "startReading": {
            let selection = window.getSelection();
            console.log(`${context}:start reading:${selection.toString()}`);
            let rne = new SelectionTextNodeExtractor(selection);
            rne.getNodes().forEach(node => {
                console.group();
                console.log(`${context}:node name:${node.nodeName}`); 
                console.log(`${context}:node text:${node.textContent}`);
                console.log(`${context}:node tag:${node.tagName}`);
                console.groupEnd();
            });
        }
        break;
        case "stopReading": {
            console.log(`${context}:stop reading:${message.message}`);
        }
        break;
        default: {
            console.log(`${context}:unknown message:${message.message}`);
        }
    }
});
