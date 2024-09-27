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



// p2: Handle request from background script, to read the selected text
// cant use innerHTML 
// solution https://dev.to/btopro/simple-wrap-unwrap-methods-explained-3k5f#:~:text=How%20it%20works,inside%20that%20tag.
// p2 use window.onunload to call service worker to stop reading
// p2 use window.onload to initialize the text highlighter
let highlighterWalker; 
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.message) {
        case "init":{

        }
        break;
        case "start": {
            highlighterWalker= new HighlighterWalker();
            let range = window.getSelection().getRangeAt(0)
            console.log(range);
            let test = highlighterWalker.highlightIn(range);
            if (test) {console.log("highlighted");} else {console.log("not highlighted");}
            highlighterWalker.highlightBetween(0, 4);

            // 
            // let selection = window.getSelection();
            // textHighlighter = new TextHighlighter(selection, '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'));
            // do {
            //     textHighlighter.highlightSpan('#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'));
            // } while (textHighlighter.nextSpan());

        }
        break;
        case "word": {

        }
        case "end": {
            // console.log("next word");
            // textHighlighter.nextWord();
            // textHighlighter.highlightWord();
        }
        break;
        case "stop": {
            console.log(`${context}:stop reading:${message.message}`);
        }
        break;
        default: {
            throw new Error(`${context}:unknown message:${message.message}`);
        }
    }
});
