class SelectionElmInjector {
    // Private property
    /**
     * The passed selection object from the DOM.
     *
     * @type {Selection} - instance of Selection object or null
     */
    #selectionObject;
    /**
     * This is the css class Id for all elm tags injected into the DOM.
     *
     * @type {string} - UUID 36 random character string with a leading letter "a". Total 37 characters 
     */
    #classId
    /**
     * Format "{classId: string, fullText: string, elms: Array.<JSON>}"
     *
     * @type {JSON} - null or JSON w/ format: "{classId: string, fullText: string, elms: Array.<JSON>}"
     */
    #injectElmsObj;
    /**
     * Regular expression to match words, punctuation and special characters.
     *
     * @type {RegExp} - Default expression "/[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g".
     */
    #regex; // TODO: rename

    #elmTagStr;  
    // getters
    // TODO: write JSDoc
    get injectElmsObj() {
        return this.#injectElmsObj;
    }

    /**
     * Creates an instance of SelectionelmInjector.
     * DOM access is required.
     * 
     * @constructor
     * @throws {Error} - If the Selection, Document or crypto is undefined or null
     */
    constructor(selection, elmTagStr, regex) {
        // Check if the Selection, Document and crypto are accessible.
        if (typeof Document === undefined || Document === null) {
            throw new Error('SelectionElmInjector:constructor: Document Object is undefined or null, accesses to the DOM is required');
        }else if (typeof Selection === undefined || Selection === null) {
            throw new Error('SelectionElmInjector:constructor: Selection Object is undefined or null, accesses to the DOM is required');
        }
        else if (typeof crypto.randomUUID() === 'function') {
            throw new Error('SelectionElmInjector:constructor: Can not access Crypto interface, required for UUID generation');
        }
        // Initialize the private properties
        this.#classId = "a" + crypto.randomUUID(); 
        this.#elmTagStr = elmTagStr;
        this.#selectionObject = selection;
        this.#regex = regex;
        this.#injectElmsObj = this.#injectTags(); 
    }
    // private methods
    // TODO: write JSDoc
    /* 
    #spanTagDOMInjector - Injects span tags into the DOM, around the selected text
    @private
    @returns {Object} - An object containing the injected span Ids, class Ids and the full text. See example in injectTagsIn() method
    */ 
    #injectTags() {
        let fullText = this.#selectionObject.toString(), // TEST: REMOVE
        tempFullParsedText = "",
        tempInjectElmsObj = 
        {
            classId: this.#classId,
            tag: this.#elmTagStr,
            fullText: "",
            count: 0,
            matchCount: 0,
            elms: []
        }, 
        treeWalker = document.createTreeWalker( // NodeIterator object
            this.#selectionObject.getRangeAt(0).commonAncestorContainer, 
            NodeFilter.SHOW_TEXT, 
            (node) => { 
                let filterFlag = NodeFilter.FILTER_REJECT; 
                if(
                    this.#selectionObject.getRangeAt(0).intersectsNode(node)
                    && !/^\s*$/g.exec(node.textContent)
                ){
                    filterFlag = NodeFilter.FILTER_ACCEPT; 
                }
                return filterFlag;
            },
            null
        ),
        currentNode,
        nodeCount = 0, // TEST: Counter for node on each iteration
        totalMatchCount = 0;
        // NodeIterator loop
        console.group('SelectionSpanInjector:injectTags:NodeIterator Loop'); 
        console.groupCollapsed('Full Text');
        console.log(`${fullText}`);
        console.groupEnd();
        while (currentNode = treeWalker.nextNode()) {
            console.group(`Iteration ${nodeCount}`);
            nodeCount++; 
            // TEST: Generate a random hex color, for the elm background
            // const testHex = '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')
            // BUG: The selection object is not working as expected, not all nodes are being injected. 
            // https://stackoverflow.com/questions/1482832/how-to-get-all-elements-that-are-highlighted/1483487#1483487
            // FIXME: allow first node and last if there is a partial match
            // Believe the issue is with intersectsNode and toString().includes.
            console.log(`Current Node txt: ${currentNode.textContent}`);
            // FIXME: not clean code, need to refactor.
            // note sure if needed
            // Generate a UUID and elm element
            const uuid = crypto.randomUUID();
            let wrapperEl = document.createElement(this.#elmTagStr);
            // // Set the elm element attributes
            wrapperEl.setAttribute('id', uuid);
            wrapperEl.setAttribute('classId', this.#classId);
            // wrapperEl.setAttribute('style', `background-color:${testHex}`);
            // // Inject the elm element into DOM 
            this.#injectParentElm(wrapperEl, currentNode);
            tempFullParsedText += wrapperEl.textContent;
            // Get the word ranges in the elm element
            let matchObj = this.#wordRangesInStr(wrapperEl.textContent);
            totalMatchCount += matchObj.length;
            // Add the elm element to the elms array
            tempInjectElmsObj.elms.push({
                id: uuid,
                fullText: wrapperEl.textContent,
                matchCount: matchObj.length,
                matches: matchObj,
            });      
            console.groupEnd();
        }
        console.groupEnd();
        tempInjectElmsObj.fullText = tempFullParsedText;
        tempInjectElmsObj.count = tempInjectElmsObj.elms.length;
        tempInjectElmsObj.matchCount = totalMatchCount;
        return tempInjectElmsObj; 
    }
    /**
     * Get the word ranges in a string as an array of JSON objects 
     * with the word, start index, end index and order the word appears in the string.
     *
     * @param {string} str - String to be parsed 
     * @returns {Array.<JSON>} Array of JSON, object format {word: word ,indexStart: start, indexEnd: end, order:currentCount}
     */
    #wordRangesInStr(str) {
        let array = [],
        match;
        while (match = this.#regex.exec(str)) {
            const start = match.index,
            text = match[0],
            end = start + match[0].length - 1;
            array.push({text: text ,startIndex: start, endIndex: end});
        }
        return array;
    }
    /**
     * Inject a HTML element around another HTML element or node.
     *
     * @param {element} wrapperEl Element to be injected into DOM
     * @param {element} childEl the element to inject the element around
     */
    #injectParentElm(wrapperEl, childEl) {
        if (childEl && childEl.parentNode) {
            childEl.parentNode.insertBefore(wrapperEl, childEl);
            wrapperEl.appendChild(childEl);
        }
    }
}


class TextHighlighter extends SelectionElmInjector {
    #spanIndex;
    #wordIndex;
    #highlightColor;

    get wordCount() {
        return this.injectElmsObj.matchCount;
    }

    get currentSpan() {
        return this.injectElmsObj.elms[this.#spanIndex];
    }

    get currentWord() {
        return this.currentSpan.matches[this.#wordIndex];
    }

    constructor(selection, highlightColor) {
        super(selection, 'span', /[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g);
        this.#spanIndex = 0;
        this.#wordIndex = 0;
        this.#highlightColor = highlightColor;

       console.log(this.injectElmsObj);

        // add highlights styles. 
        let sheet = document.styleSheets[0];
        let sheetIndex = sheet.cssRules.length;
        sheet.insertRule(`
            ::highlight(my-custom-highlight) {
                background-color: yellow;
                color: black;
            }`, 0);
            console.log(sheet);

        // https://developer.mozilla.org/en-US/docs/Web/API/CSS/highlights_static
    }

    nextWord() {
        if (this.#wordIndex < this.injectElmsObj.elms[this.#spanIndex].matchCount - 1) {
            this.#wordIndex++;
        } else if (this.#spanIndex < this.injectElmsObj.count - 1) {
            this.#spanIndex++;
            this.#wordIndex = 0;
        } else {
            return false;
        }
        return true;
    }

    previousWord() {
        if (this.#wordIndex > 0) {
            this.#wordIndex--;
        } else if (this.#spanIndex > 0) {
            this.#spanIndex--;
            this.#wordIndex = this.injectElmsObj.elms[this.#spanIndex].matchCount - 1;
        } else {
            return false;
        }
        return true;
    }

    nextSpan() {
        if (this.#spanIndex < this.injectElmsObj.count - 1) {
            this.#spanIndex++;
            this.#wordIndex = 0;
        } else {
            return false;
        }
        return true;
    }

    previousSpan() {
        if (this.#spanIndex > 0) {
            this.#spanIndex--;
            this.#wordIndex = 0;
        } else {
            return false;
        }
        return true;    
    }

    highlightWord() {
        let parentSpan = document.getElementById(this.currentSpan.id).firstChild;
        let range = new Range();
        range.setStart(parentSpan, this.currentWord.startIndex); 
        range.setEnd(parentSpan, this.currentWord.endIndex + 1);
        const myCustomHighlight = new Highlight(range);
        CSS.highlights.set('my-custom-highlight', myCustomHighlight);
    }

    highlightSpan(highlightColor = this.#highlightColor) {
        let span = document.getElementById(this.currentSpan.id);
        span.style.backgroundColor = highlightColor;
    }

    unhighlightSpan() {
        let span = document.getElementById(this.injectElmsObj.elms[this.#spanIndex].id);
        span.style.backgroundColor = '';
    }

}
