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
    isReading: false,
};
// p2: Handle request from background script, to read the selected text
// cant use innerHTML 
// solution https://dev.to/btopro/simple-wrap-unwrap-methods-explained-3k5f#:~:text=How%20it%20works,inside%20that%20tag.
// p2 use window.onunload to call service worker to stop reading
// p2 use window.onload to initialize the text highlighter
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.message) {
        case "selected": {
            console.log(`read selected text:${message.message}`);
            let selection = window.getSelection();
            let selectedRange = selection.getRangeAt(0);
            textNodesObj.textNodes = Highlighter.parseTextNodes(selectedRange);
            textNodesObj.index = 0;
            textNodesObj.isReading = true;
        }
        break;
        case "word": {

        }
        case "end": {

        }
        break;
        case "stop": {
            console.log(`stop reading:${message.message}`);
        }
        break;
        case "test": {
            let highlightRange = new Range();
            highlightRange.setStart(textNodesObj.textNodes[textNodesObj.index], 0);
            highlightRange.setEnd(textNodesObj.textNodes[textNodesObj.index], 5);
            highlighter.setHighlight(highlightRange);
            console.log(`test:${highlightRange}`);
        }
        break;
        default: {
            throw new Error(`unknown message:${message.message}`);
        }
    }
});
