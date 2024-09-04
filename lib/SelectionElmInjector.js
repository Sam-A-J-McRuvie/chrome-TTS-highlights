// IDEA: Incorporate the functionality to hight text in the DOM, with the elm tags.
class SelectionElmInjector {
    // Private property
    /**
     * The passed selection object, can be null. 
     *
     * @type {(Selection|null)} - instance of Selection object or null
     */
    #selectionObject;
    /**
     * This is the css class Id for all elm tags injected into the DOM.
     *
     * @type {(string|null)} - UUID 36 random character string with a leading letter "a". Total 37 characters 
     */
    #classId
    /**
     * Format "{classId: string, fullText: string, elms: Array.<JSON>}"
     *
     * @type {(JSON|null)} - null or JSON w/ format: "{classId: string, fullText: string, elms: Array.<JSON>}"
     */
    #JSONTagsObj;
    /**
     * Regular expression to match words, punctuation and special characters.
     *
     * @type {RegExp} - Default expression "/[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g".
     */
    #regex; // TODO: rename to #wordRegex

    #elmTagStr;  
    // getters
    // TODO: write JSDoc
    get JSONTagsObj() {
        return this.#JSONTagsObj;
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
            throw new Error('SelectionTagInjector:constructor: Document Object is undefined or null, accesses to the DOM is required');
        }else if (typeof Selection === undefined || Selection === null) {
            throw new Error('SelectionTagInjector:constructor: Selection Object is undefined or null, accesses to the DOM is required');
        }
        else if (typeof crypto.randomUUID() === 'function') {
            throw new Error('SelectionTagInjector:constructor: Can not access Crypto interface, required for UUID generation');
        }
        // Initialize the private properties
        this.#classId = "a" + crypto.randomUUID(); 
        this.#elmTagStr = elmTagStr;
        this.#selectionObject = selection;
        this.#regex = regex;
        this.#JSONTagsObj = this.#injectTags(); 
    }
    // Public method

    removeAllTags() {  
        // BUG: not working
        if(this.#classId === null) return;
        let elms = document.querySelectorAll(`.${this.#classId}`);
        elms.forEach((elm) => {
            // FIXME: would rather not use innerHTML as it can mess with nodes.
            elm.outerHTML = elm.innerHTML;
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
            elmCount: 0,
            totalWordCount: 0,
            elms: []
        }, 
        treeWalker = document.createTreeWalker( // NodeIterator object
            this.#selectionObject.getRangeAt(0).commonAncestorContainer, 
            NodeFilter.SHOW_TEXT, 
            (node) => { 
                let filterFlag = NodeFilter.FILTER_REJECT;
                if(
                    !/^\s*$/g.exec(node.textContent) &&
                    this.#selectionObject.getRangeAt(0).intersectsNode(node) &&
                    fullText.includes(node.textContent.trim()) 
                ){
                    filterFlag = NodeFilter.FILTER_ACCEPT; 
                }
                return filterFlag;
            },
            null
        );
        // NodeIterator loop
        console.group('SelectionSpanInjector:injectTags:NodeIterator Loop'); 
        console.groupCollapsed('Full Text');
        console.log(`${fullText}`);
        console.groupEnd();
        let currentNode,
        nodeCount = 0,
        totalWordCount = 0; // TEST: Counter for node on each iteration
        while (currentNode = treeWalker.nextNode()) {
            console.group(`Iteration ${nodeCount}`);
            nodeCount++; 
            // TEST: Generate a random hex color, for the elm background
            const testHex = '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')
            // BUG: The selection object is not working as expected, not all nodes are being injected. 
            // https://stackoverflow.com/questions/1482832/how-to-get-all-elements-that-are-highlighted/1483487#1483487
            // FIXME: allow first node and last if there is a partial match
            // Believe the issue is with intersectsNode and toString().includes.
            console.log(`Current Node txt: ${currentNode.textContent}`);
            // FIXME: not clean code, need to refactor.
            // note sure if needed
            console.log('Selection includes node');
            // Generate a UUID and elm element
            const uuid = crypto.randomUUID();
            let wrapperEl = document.createElement(this.#elmTagStr);
            // // Set the elm element attributes
            wrapperEl.setAttribute('id', uuid);
            wrapperEl.setAttribute('classId', this.#classId);
            wrapperEl.setAttribute('style', `background-color:${testHex}`);
            // // Inject the elm element into DOM 
            this.#injectParentElm(wrapperEl, currentNode);
            tempFullParsedText += wrapperEl.textContent;
            // // Get the word ranges in the elm element
            let wordsObj = this.#wordRangesInStr(wrapperEl.textContent);
            totalWordCount += wordsObj.length;
            // // Add the elm element to the elms array
            tempJSONTagsObj.elms.push({
                id: uuid,
                fullText: wrapperEl.textContent,
                wordCount: wordsObj.length,
                words: wordsObj,
            });      
            console.groupEnd();
        }
        console.groupEnd();
        tempJSONTagsObj.fullText = tempFullParsedText;
        tempJSONTagsObj.elmCount = tempJSONTagsObj.elms.length;
        tempJSONTagsObj.totalWordCount = totalWordCount;
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
    #injectParentElm(wrapperEl, childEl) {
        if (childEl && childEl.parentNode) {
            childEl.parentNode.insertBefore(wrapperEl, childEl);
            wrapperEl.appendChild(childEl);
        }
    }
}



class textHighlighter extends SelectionElmInjector {
    #spanIndex;
    #wordIndex;
    #highlightColor;

    get spanCount() {
        return this.JSONTagsObj.elmCount;
    }

    get wordCount() {
        return this.JSONTagsObj.totalWordCount;
    }

    get currentWord() {
        return this.JSONTagsObj.elms[this.#spanIndex].words[this.#wordIndex].word;
    }

    nextWord() {
        if (this.#wordIndex < this.JSONTagsObj.elms[this.#spanIndex].wordCount - 1) {
            this.#wordIndex++;
        } else if (this.#spanIndex < this.JSONTagsObj.elmCount - 1) {
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
            this.#wordIndex = this.JSONTagsObj.elms[this.#spanIndex].wordCount - 1;
        } else {
            return false;
        }
        return true;
    }

    highlightSpan() {
        let span = document.getElementById(this.JSONTagsObj.elms[this.#spanIndex].id);
        span.style.backgroundColor = this.#highlightColor;
    }

    constructor(selection, highlightColor) {
        super(selection, 'span', /[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g);
        this.#spanIndex = 0;
        this.#wordIndex = 0;
        this.#highlightColor = highlightColor;
    }
}
