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
    #injectedTagsObj;
    /**
     * Regular expression to match words, punctuation and special characters.
     *
     * @type {RegExp} - Default expression "/[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g".
     */
    #regex;    
    
    // getters
    // TODO: write JSDoc
    get classId() {
        console.assert(this.#classId !== null, 'SelectTextExtractor:classId: Property is null, call injectTagsIn() first');
        return this.#classId;
    }
    // TODO: write JSDoc
    get injectedTagsObj() {
        console.assert(this.#injectedTagsObj !== null, 'SelectTextExtractor:injectedTagsObj: Property is null, call injectTagsIn() first');
        return this.#injectedTagsObj;
    }
    /**
     * Creates an instance of SelectTextExtractor.
     * DOM access is required.
     * 
     * @constructor
     * @throws {Error} - If the Selection, Document or crypto is undefined or null
     */
    constructor() {
        // Check if the Selection, Document and crypto are accessible 
        if (typeof Document === undefined || Document === null) {
            throw new Error('SelectTextExtractor:constructor: Document Object is undefined or null, accesses to the DOM is required');
        }else if (typeof Selection === undefined || Selection === null) {
            throw new Error('SelectTextExtractor:constructor: Selection Object is undefined or null, accesses to the DOM is required');
        }
        else if (typeof crypto.randomUUID() === 'function') {
            throw new Error('SelectTextExtractor:constructor: Can not access Crypto interface, required for UUID generation');
        }
        // Initialize the private properties
        this.#injectedTagsObj = null; 
        this.#classId = null;
        this.#regex = /[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g;
    }
    // Public method
    // TODO: write JSDoc
    /**
     * Description placeholder
     *
     * @param {object} - selection
     * @returns {*}
     */
    injectTagsIn(selection) {
        // Check if the selection object is valid
        if(typeof selection === undefined || selection === null) {
            throw new Error('SelectTextExtractor:injectTagsIn: Passed selection object is undefined or null')
        }else if(selection.focusNode === null || selection.anchorNode === undefined) {
            throw new Error('SelectTextExtractor:injectTagsIn: Passed selection object is empty, no focusNode or anchorNode found')
        }
        if(this.#classId !== null) this.clearTags();

        this.#selectionObject = selection;
        // Generate a UUID for the class, class requires a leading letter
        this.#classId = "a" + crypto.randomUUID();
        // Inject the span tags into the DOM and return the object
        this.#injectedTagsObj = this.#spanTagDOMInjector();
        return this.#injectedTagsObj;
    }
    // TODO: write JSDoc
    /* 
    * Removes the span tags from the DOM
    * @public
    */
    clearTags() {
        if(this.#classId === null) return;
        let spans = document.querySelectorAll(`.${this.#classId}`);
        spans.forEach((span) => {
            span.outerHTML = span.innerHTML;
        });
        this.#classId = null;
    }

    // TODO: write JSDoc
    clearSelection() {
        if(this.#selectionObject === null) return;
        this.#selectionObject.removeAllRanges();
        this.#selectionObject = null;
    }
    // private methods
    // TODO: write JSDoc
    /* 
    #spanTagDOMInjector - Injects span tags into the DOM, around the selected text
    @private
    @returns {Object} - An object containing the injected span Ids, class Ids and the full text. See example in injectTagsIn() method
    */ 
    #spanTagDOMInjector() {
        let tempFullText = "";
        let tempSpanIdsObj = 
        {
            classId: this.#classId,
            fullText: "",
            spans: []
        };
        // NodeIterator object
        let nodeIterator = document.createNodeIterator(
            this.#selectionObject.getRangeAt(0).commonAncestorContainer, 
            NodeFilter.SHOW_TEXT, 
            (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
            }
        );
        // NodeIterator loop
        let currentNode;
        while (currentNode = nodeIterator.nextNode()) {
            // TEST: Generate a random hex color, for the span background
            const testHex = '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')
            //FIXME: Check end of range and break
            if(this.#selectionObject.getRangeAt(0).intersectsNode(currentNode)){
                // FIXME: not clean code, need to refactor. 
                if (this.#selectionObject.toString().includes(currentNode.textContent) === true){
                    // Generate a UUID and span element
                    const uuid = crypto.randomUUID();
                    let wrapperEl = document.createElement('span');
                    // Set the span element attributes
                    wrapperEl.setAttribute('id', uuid);
                    wrapperEl.setAttribute('class', this.#classId);
                    wrapperEl.setAttribute('style', `background-color:${testHex}`);
                    // Inject the span element into DOM 
                    this.#injectParentSpan(wrapperEl, currentNode);
                    tempFullText += wrapperEl.textContent;
                    // Get the word ranges in the span element
                    let wordsObj = this.#wordRangesInStr(wrapperEl.textContent);
                    // Add the span element to the spans array
                    tempSpanIdsObj.spans.push({
                        id: uuid,
                        fullText: wrapperEl.textContent,
                        wordCount: wordsObj.length,
                        words: wordsObj,
                    });      
                }
            }
            currentNode = nodeIterator.nextNode();
        } 
        tempSpanIdsObj.fullText = tempFullText;
        this.#injectedTagsObj = tempSpanIdsObj
        return this.#injectedTagsObj; 
    }
    /**
     * Get the word ranges in a string as an array of JSON objects 
     * with the word, start index, end index and order the word appears in the string.
     *
     * @param {string} str - String to be parsed 
     * @returns {Array.<JSON>} Array of JSON, object format {word: word ,indexStart: start, indexEnd: end, order:currentCount}
     */
    #wordRangesInStr(str) {
        let currentCount = 0;
        let array = [];
        let match;
        while (match = this.#regex.exec(str)) {
            currentCount++;
            const start = match.index;
            const word = match[0];
            const end = start + match[0].length - 1;
            array.push({word: word ,indexStart: start, indexEnd: end, order:currentCount});
        }
        return array;
    }
    /**
     * Inject a span element around another element
     *
     * @param {element} parentEl Element to be injected into DOM
     * @param {element} childEl the element to inject the element around
     */
    #injectParentSpan(parentEl, childEl) {
        if (el && el.parentNode) {
          el.parentNode.insertBefore(parentEl, childEl);
          wrapper.appendChild(el);
        }
    }

}
