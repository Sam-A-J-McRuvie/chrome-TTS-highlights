// IDEA: Incorporate the functionality to hight text in the DOM, with the span tags.
class SelectTextExtractor {
    // Private property
    /**
     * The passed selection object, can be null. 
     *
     * @type {(Selection|null)} - instance of Selection object or null
     */
    #selectionObject;
    /**
     * This is the css class Id for all span tags injected into the DOM.
     *
     * @type {(string|null)} - UUID 36 random character string with a leading letter "a". Total 37 characters 
     */
    #classId
    /**
     * Format "{classId: string, fullText: string, spans: Array.<JSON>}"
     *
     * @type {(JSON|null)} - null or JSON w/ format: "{classId: string, fullText: string, spans: Array.<JSON>}"
     */
    #JSONTagsObj;
    /**
     * Regular expression to match words, punctuation and special characters.
     *
     * @type {RegExp} - Default expression "/[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g".
     */
    #regex;    
    
    // getters

    // TODO: write JSDoc
    get JSONTagsObj() {
        console.assert(this.#JSONTagsObj !== null, 'SelectTextExtractor:JSONTagsObj: Property is null, call injectTagsIn() first');
        return this.#JSONTagsObj;
    }
    /**
     * Creates an instance of SelectTextExtractor.
     * DOM access is required.
     * 
     * @constructor
     * @throws {Error} - If the Selection, Document or crypto is undefined or null
     */
    constructor(
        selection, 
        regex = /[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g
    ) {
        // Check if the Selection, Document and crypto are accessible 
        if (typeof Document === undefined || Document === null) {
            throw new Error('SelectTextExtractor:constructor: Document Object is undefined or null, accesses to the DOM is required');
        }else if (typeof Selection === undefined || Selection === null) {
            throw new Error('SelectTextExtractor:constructor: Selection Object is undefined or null, accesses to the DOM is required');
        }
        else if (typeof crypto.randomUUID() === 'function') {
            throw new Error('SelectTextExtractor:constructor: Can not access Crypto interface, required for UUID generation');
        }
        if(selection === undefined || selection === null) {
            throw new Error('SelectTextExtractor:constructor: Passed selection object is undefined or null')
        }else if(selection.focusNode === null || selection.anchorNode === undefined) {
            throw new Error('SelectTextExtractor:constructor: Passed selection object is empty, no focusNode or anchorNode found')
        }
        // Initialize the private properties
        this.#classId = "a" + crypto.randomUUID(); 
        this.#regex = regex;
        this.#selectionObject = selection;
        this.#JSONTagsObj = this.#injectTags(); 
    }
    // Public method
    clearTags() {  
        // BUG: not working
        if(this.#classId === null) return;
        let spans = document.querySelectorAll(`.${this.#classId}`);
        spans.forEach((span) => {
            // FIXME: would rather not use innerHTML as it can mess with nodes.
            span.outerHTML = span.innerHTML;
        });
        this.#classId = null;
    }
    // private methods
    // TODO: write JSDoc
    /* 
    #spanTagDOMInjector - Injects span tags into the DOM, around the selected text
    @private
    @returns {Object} - An object containing the injected span Ids, class Ids and the full text. See example in injectTagsIn() method
    */ 
    #injectTags() {
        // IDEA look into rework w/ https://gist.github.com/zer00ne/579a100bb708abceddae
        // https://stackoverflow.com/questions/4398526/how-can-i-find-all-text-nodes-between-two-element-nodes-with-javascript-jquery
        
        let fullText = this.#selectionObject.toString(), 
        tempFullParsedText = "",
        tempJSONTagsObj = 
        {
            classId: this.#classId,
            fullText: "",
            spans: []
        }, 
        treeWalker = document.createTreeWalker( // NodeIterator object
            this.#selectionObject.getRangeAt(0).commonAncestorContainer, 
            NodeFilter.SHOW_TEXT, 
            (node) => { 
                let filterFlag = NodeFilter.FILTER_REJECT;
                if(/^\s*$/g.exec(node.textContent)){
                    filterFlag = NodeFilter.FILTER_REJECT
                }else if(
                    this.#selectionObject.getRangeAt(0).intersectsNode(node) ||
                    fullText.includes(node.textContent) // FIXME: not working as expected
                ){
                    filterFlag = NodeFilter.FILTER_ACCEPT; 
                }
                return filterFlag;
            },
            null
        );
        // NodeIterator loop
        console.group('SelectTextExtractor:injectTags:NodeIterator Loop'); 
        console.groupCollapsed('Full Text');
        console.log(`${fullText}`);
        console.groupEnd();
        let currentNode,
        i = 0; // TEST: Counter for node on each iteration
        while (currentNode = treeWalker.nextNode()) {
            console.group(`Iteration ${i}`);
            i++; 
            // TEST: Generate a random hex color, for the span background
            const testHex = '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')
            // BUG: The selection object is not working as expected, not all nodes are being injected. 
            // https://stackoverflow.com/questions/1482832/how-to-get-all-elements-that-are-highlighted/1483487#1483487


            // FIXME: allow first node and last if there is a partial match
            // Believe the issue is with intersectsNode and toString().includes.
 
            console.log(`Current Node txt: ${currentNode.textContent}`);
            // // FIXME: not clean code, need to refactor.
            // // note sure if needed
            // console.log('Selection includes node');
            // // Generate a UUID and span element
            // const uuid = crypto.randomUUID();
            // let wrapperEl = document.createElement('span');
            // // Set the span element attributes
            // wrapperEl.setAttribute('id', uuid);
            // wrapperEl.setAttribute('class', this.#classId);
            // wrapperEl.setAttribute('style', `background-color:${testHex}`);
            // // Inject the span element into DOM 
            // this.#injectParentSpan(wrapperEl, currentNode);
            // tempFullText += wrapperEl.textContent;
            // // Get the word ranges in the span element
            // let wordsObj = this.#wordRangesInStr(wrapperEl.textContent);
            // // Add the span element to the spans array
            // tempSpanIdsObj.spans.push({
            //     id: uuid,
            //     fullText: wrapperEl.textContent,
            //     wordCount: wordsObj.length,
            //     words: wordsObj,
            // });      
            // currentNode = treeWalker.nextNode();
            console.groupEnd();
        }
        console.groupEnd();
        tempJSONTagsObj.fullText = tempFullParsedText;
        return tempJSONTagsObj; 
    }
    /**
     * Get the word ranges in a string as an array of JSON objects 
     * with the word, start index, end index and order the word appears in the string.
     *
     * @param {string} str - String to be parsed 
     * @returns {Array.<JSON>} Array of JSON, object format {word: word ,indexStart: start, indexEnd: end, order:currentCount}
     */
    #wordRangesInStr(str) {
        let currentCount = 0,
        array = [],
        match;
        while (match = this.#regex.exec(str)) {
            currentCount++; 
            const start = match.index,
            word = match[0],
            end = start + match[0].length - 1;
            array.push({word: word ,indexStart: start, indexEnd: end, order:currentCount});
        }
        return array;
    }

    /**
     * Inject a HTML element around another HTML element or node.
     *
     * @param {element} wrapperEl Element to be injected into DOM
     * @param {element} childEl the element to inject the element around
     */
    #injectParentSpan(wrapperEl, childEl) {
        if (childEl && childEl.parentNode) {
            childEl.parentNode.insertBefore(wrapperEl, childEl);
            wrapperEl.appendChild(childEl);
        }
    }
}

// IDEA check out code below for reference
// function getTextNodesBetween(selection) {
//     var range = selection.getRangeAt(0), rootNode = range.commonAncestorContainer,
//         startNode = range.startContainer, endNode = range.endContainer,
//         startOffset = range.startOffset, endOffset = range.endOffset,
//         pastStartNode = false, reachedEndNode = false, textNodes = [];
//     function getTextNodes(node) {
//       var val = node.nodeValue;
//       if(node == startNode && node == endNode && node !== rootNode) {
//         if(val) textNodes.push(val.substring(startOffset, endOffset));
//         pastStartNode = reachedEndNode = true;
//       } else if(node == startNode) {
//         if(val) textNodes.push(val.substring(startOffset));
//         pastStartNode = true;
//       } else if(node == endNode) {
//         if(val) textNodes.push(val.substring(0, endOffset));
//         reachedEndNode = true;
//       } else if(node.nodeType == 3) {
//         if(val && pastStartNode && !reachedEndNode && !/^\s*$/.test(val)) {
//           textNodes.push(val);
//         }
//       }
//       for(var i = 0, len = node.childNodes.length; !reachedEndNode && i < len; ++i) {
//         if(node !== sumterDialog) getTextNodes(node.childNodes[i]);
//       }
//     }
//     getTextNodes(rootNode);
//     return textNodes;
//   }
  