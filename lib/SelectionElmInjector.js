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
        let tempFullParsedText = "",
        currentNode,
        totalMatchCount = 0,
        tempInjectElmsObj = 
        {
            classId: this.#classId,
            tag: this.#elmTagStr,
            fullText: "",
            count: 0,
            matchCount: 0,
            elms: []
        }, 
        treeWalker = document.createTreeWalker(
            this.#selectionObject.getRangeAt(0).commonAncestorContainer, 
            NodeFilter.SHOW_TEXT, 
            (node) => { 
                let filterFlag = NodeFilter.FILTER_REJECT; 
                if(
                    this.#selectionObject.getRangeAt(0).intersectsNode(node)
                    && !/^\s*$/g.exec(node.textContent)
                    && node.parentElement.checkVisibility(
                        {
                            contentVisibilityAuto: true,
                            opacityProperty: true,
                            visibilityProperty: true,
                            checkOpacity: true,
                            checkVisibilityCSS : true,
                        }
                    ) === true
                ){
                    filterFlag = NodeFilter.FILTER_ACCEPT; 
                };
                return filterFlag;
            },
            null
        ); 
        // NodeIterator loop
        console.group('SelectionSpanInjector:injectTags:NodeIterator Loop'); 
        while (currentNode = treeWalker.nextNode()) {
            console.group(`Iterations`);
            console.log(`Current Node txt: ${currentNode.textContent}`);
            // Generate a UUID and wrapper element
            const uuid = crypto.randomUUID();
            // Create wrapper element, set id and class attributes
            let wrapperEl = document.createElement(this.#elmTagStr);
            wrapperEl.setAttribute('id', uuid);
            wrapperEl.setAttribute('classId', this.#classId);
            // Inject the wrapper element into DOM around the current text node
            this.#injectParentElm(wrapperEl, currentNode);
            tempFullParsedText += wrapperEl.textContent;
            // Get the word ranges in the wrapper element
            let matchObj = this.#wordRangesInStr(wrapperEl.textContent);
            totalMatchCount += matchObj.length;
            
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
    #customHighlightName;
    #backgroundColor;
    #textColor;

    get wordCount() {
        return this.injectElmsObj.matchCount;
    }

    get currentSpan() {
        return this.injectElmsObj.elms[this.#spanIndex];
    }

    get currentWord() {
        return this.currentSpan.matches[this.#wordIndex];
    }

    constructor(selection, backgroundColor = "yellow", textColor = "black") {
        super(selection, 'span', /[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g);
        this.#spanIndex = 0;
        this.#wordIndex = 0;
        this.#backgroundColor = backgroundColor;
        this.#textColor = textColor;
        this.#customHighlightName = 'a'+crypto.randomUUID();

       console.log(this.injectElmsObj);

        // add highlights styles. 
        let sheet = document.styleSheets[0];
        let sheetIndex = sheet.cssRules.length;
        sheet.insertRule(`
            ::highlight(${this.#customHighlightName}) {
                background-color: ${this.#backgroundColor};
                color: ${this.#textColor};
            }`, sheetIndex);

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
        CSS.highlights.set(`${this.#customHighlightName}`, myCustomHighlight);
    }

    highlightSpan(highlightColor = this.#backgroundColor) {
        let span = document.getElementById(this.currentSpan.id);
        span.style.backgroundColor = highlightColor;
    }

    unhighlightSpan() {
        let span = document.getElementById(this.injectElmsObj.elms[this.#spanIndex].id);
        span.style.backgroundColor = '';
    }

}
