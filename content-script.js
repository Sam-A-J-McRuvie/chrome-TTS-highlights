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
const context = 'content-script'; // TODO: Refactor, not really needed
console.log(`${context}:loaded at:${new Date().toLocaleTimeString()}`); 

let textHighlighter;

// TODO: Handle request from background script, to read the selected text
// TODO: refactor to make readable
// cant use innerHTML 
// solution https://dev.to/btopro/simple-wrap-unwrap-methods-explained-3k5f#:~:text=How%20it%20works,inside%20that%20tag.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.message) {
        case "startReading": {

            let range = window.getSelection().getRangeAt(0)

            let textNodeWrapper = new TextNodeWrapper();

            textNodeWrapper.nodeFilterFunc = function(node){
                throw new Error("node filter func");
            }
            console.log(textNodeWrapper.wrapTextIn(range));

            // 
            // let selection = window.getSelection();
            // textHighlighter = new TextHighlighter(selection, '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'));
            // do {
            //     textHighlighter.highlightSpan('#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'));
            // } while (textHighlighter.nextSpan());

        }
        break;
        case "nextWord": {
            // console.log("next word");
            // textHighlighter.nextWord();
            // textHighlighter.highlightWord();
        }
        break;
        case "pauseReading": {


        }
        break;
        case "stopReading": {
            console.log(`${context}:stop reading:${message.message}`);
        }
        break;
        default: {
            throw new Error(`${context}:unknown message:${message.message}`);
        }
    }
});
