    /* IDEA: Generalize class
    * 1. Create a class that can inject any HTML element around a selected text.
    * 2. Allow user to specify a filter for the text nodes that can be selected.
    */
   /* TODO: Refactor list
    *  1. Error messages
    */
class SelectionElmInjector {
    /* IDEA: Generalize class
    * 1. Create a class that can inject any HTML element around a selected text.
    * 2. Allow user to specify a filter for the text nodes that can be selected.
    */

    _allowedHtmlTags = ['span', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']; // TODO create protected method insted and check if calid html
    /**
     * This is the css class Id for all elm tags injected into the DOM.
     *
     * @type {string} - UUID 36 random character string with a leading letter "a". Total 37 characters 
     */
    #className
    /**
     * Format "{className: string, fullText: string, elms: Array.<JSON>}"
     *
     * @type {JSON} - null or JSON w/ format: "{className: string, fullText: string, elms: Array.<JSON>}"
     */
    #parseTextContentRegex;

    #wrapperHtmlTag;  

    #textNodeFilter;
    // setter and getter methods
    #setClassName(name = "a" + crypto.randomUUID()){
        this.#className = name;
    }

    set parseTextContentRegex(parseTextContentRegex) {
        if(!parseTextContentRegex instanceof RegExp) throw new Error('SelectionElmInjector:property:parseTextContentRegex: regex must be an instance of RegExp'); 
        this.#parseTextContentRegex = parseTextContentRegex;
    }

    set wrapperHtmlTag(wrapperHtmlTag) {
        if(!this.isValidateHtmlTag(wrapperHtmlTag)) throw new Error(`Invalid HTML tag string, accepted values are: ${this._allowedHtmlTags}`);
        this.#wrapperHtmlTag = wrapperHtmlTag;
    }

    set textNodeFilter(filter) {
        if(typeof filter !== 'function') throw new Error('SelectionElmInjector:property:textNodeFilter: filter must be a function');
        this.#textNodeFilter = filter;
    }

    get className() {
        return this.#className;
    }

    get wrapperHtmlTag() {
        return this.#wrapperHtmlTag;
    }
    /**
     * Creates an instance of SelectionelmInjector.
     * DOM access is required.
     * 
     * @constructor
     * @throws {Error} - If the Selection, Document or crypto is undefined or null
     */
    constructor(wrapperHtmlTag, parseTextContentRegex, 
        textNodeFilter = (node) => {
            return true;
        }
    ) {
        // Check if the Selection, Document and crypto are accessible.
        if (typeof Document === undefined || Document === null) {
            throw new Error('SelectionElmInjector:method:constructor:Document Object is undefined or null, accesses to the DOM is required');
        }
        // Initialize the private properties
        this.#setClassName(); // Safe gard property initialization, initialized here to avoid undefined error
        this.wrapperHtmlTag = wrapperHtmlTag;
        this.parseTextContentRegex = parseTextContentRegex;
        this.textNodeFilter = textNodeFilter;
    }

    isValidateHtmlTag(tag) {
        let isValid = false;
        if(typeof tag !== 'string') return isValid;
        isValid = this._allowedHtmlTags.some((str) => {
            return str === tag;
        });
        return isValid;
    }

    // private methods
    // TODO: write JSDoc
    /* 
    #spanTagDOMInjector - Injects span tags into the DOM, around the selected text
    @private
    @returns {Object} - An object containing the injected span Ids, class Ids and the full text. See example in injectTagsIn() method
    */ 
    injectTags(range) {
        this.#setClassName();
        let tempFullParsedText = "",
        currentNode,
        tempInjectElmsObj = 
        {
            className: this.#className,
            tag: this.#wrapperHtmlTag,
            fullText: "",
            count: 0,
            elms: []
        }, 
        treeWalker = document.createTreeWalker(
            range.commonAncestorContainer, 
            NodeFilter.SHOW_TEXT, 
            (node) => { 
                let filterFlag = NodeFilter.FILTER_REJECT; 
                if(
                    range.intersectsNode(node)
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
                    && this.#textNodeFilter(node) === true
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
            let wrapperEl = document.createElement(this.#wrapperHtmlTag);
            wrapperEl.setAttribute('id', uuid);
            wrapperEl.setAttribute('className', this.#className);
            // Inject the wrapper element into DOM around the current text node
            this.#injectParentElm(wrapperEl, currentNode);
            tempFullParsedText += wrapperEl.textContent;
            // Get the word ranges in the wrapper element
            let matchObj = this.#wordRangesInStr(wrapperEl.textContent);
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
        while (match = this.#parseTextContentRegex.exec(str)) {
            const start = match.index,
            text = match[0],
            end = start + match[0].length;
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
    #injectElmsObj;

    get wordCount() {
        return this.#injectElmsObj.matchCount;
    }

    get currentSpan() {
        return this.#injectElmsObj.elms[this.#spanIndex];
    }

    get currentWord() {
        return this.currentSpan.matches[this.#wordIndex];
    }

    constructor(selection, backgroundColor = "yellow", textColor = "black") {
        super("hr", /[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g);
        this.#spanIndex = 0;
        this.#wordIndex = 0;
        this.#backgroundColor = backgroundColor;
        this.#textColor = textColor;
        this.#customHighlightName = 'a'+crypto.randomUUID();
        this.#injectElmsObj = this.injectTags(selection.getRangeAt(0));

       console.log(this.#injectElmsObj);

        // add highlights styles. 
        let sheet = document.styleSheets[0];
        sheet.insertRule(`
            ::highlight(${this.#customHighlightName}) {
                background-color: ${this.#backgroundColor};
                color: ${this.#textColor};
            }`, sheet.cssRules.length);

        // https://developer.mozilla.org/en-US/docs/Web/API/CSS/highlights_static
    }

    nextWord() {
        if (this.#wordIndex < this.#injectElmsObj.elms[this.#spanIndex].matchCount - 1) {
            this.#wordIndex++;
        } else if (this.#spanIndex < this.#injectElmsObj.count - 1) {
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
            this.#wordIndex = this.#injectElmsObj.elms[this.#spanIndex].matchCount - 1;
        } else {
            return false;
        }
        return true;
    }

    nextSpan() {
        if (this.#spanIndex < this.#injectElmsObj.count - 1) {
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
        range.setEnd(parentSpan, this.currentWord.endIndex);
        const myCustomHighlight = new Highlight(range);
        CSS.highlights.set(`${this.#customHighlightName}`, myCustomHighlight);
    }

    highlightSpan(highlightColor = this.#backgroundColor) {
        let span = document.getElementById(this.currentSpan.id);
        span.style.backgroundColor = highlightColor;
    }



}
