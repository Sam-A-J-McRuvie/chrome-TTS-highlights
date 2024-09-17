/**
 * 
 */
class TextNodeWrapper {
    // private properties
    /**
     * The HTML tag to be injected.
     * @private
     * @type {string}
     */
    #wrapperElmTag = "span";
    /**
     * @description placeholder
     * @type {function}
     * @private
     * @param {object} node - The HTML text node to be checked.
     * @returns {boolean} Returns true if the node is accepted, false otherwise.
     * @default (node) => { return true; }
     */
    #nodeFilterFunc = (node) => {
        return true;
    }
    // Public setters 
    set wrapperElmTag(wrapperElmTag) { // TODO: Add a check for valid HTML tags, take code from validElmTags setter
        if(typeof wrapperElmTag !== 'string'){
            throw new TypeError(`wrapperElmTag must be a string, ${typeof wrapperElmTag} given.`);
        } else if (wrapperElmTag.length <= 0) {
            throw new Error(`wrapperElmTag must be a string with a length greater than 0, ${wrapperElmTag.length} given.`);
        }
        const parser = new DOMParser().parseFromString(`<${tag}>test</${tag}>`, 'text/html');
        const parseError = parser.documentElement.querySelector('parsererror');
        if(parseError !== null) {
            throw new Error(`wrapperElmTag must be a valid HTML tag, ${wrapperElmTag} given.`);
        }
        this.#wrapperElmTag = wrapperElmTag;
    }
    
    set nodeFilterFunc(filter) {
        if(typeof filter !== 'function') throw new TypeError(`Function expected, ${typeof filter} given.\n`);
        if(filter.length !== 1) throw new Error(`Function must have one parameter, ${filter.length} given.\n}`);
        this.#nodeFilterFunc = filter;
    }
    // public getters
    /**
     * @description Get the HTML tag used for wrapping the text nodes.
     * @public
     * @type {string}
    **/     
    get wrapperElmTag() {
        return this.#wrapperElmTag;
    }
    /**
     * @description The function that filters the text nodes.
     * @type {function} 
     * @default (node) => { return true; }
     */
    get nodeFilterFunc() {
        return this.#nodeFilterFunc;
    } 
    /**
     * @constructor
     * @param {string} wrapperElmTag - The HTML tag to be injected.
     * @throws {Error} - If Document is undefined or null.
     */
    constructor(wrapperElmTag = null) {
        // check if the Document object is available, if not throw an error
        if (typeof Document === undefined) {
            throw new Error(``);
        } else if(Document === null){
            throw new Error(``);
        }
        // Initialize the private properties if the constructor argument is not null
        if(wrapperElmTag !== null) this.wrapperElmTag = wrapperElmTag;
    }

    // Public methods
    wrapTextIn(range) {
        // Check if the range is a valid Range object
        if (!range instanceof Range) {
            throw new TypeError(`Parameter range must be a Range object, ${typeof range} given.`);
        }else if(range.collapsed === true) {
            throw new Error('Parameter range is collapsed, range must be a non-collapsed range.');
        }
        let tempFullParsedText = "",
        currentNode,
        className = this.#getSafeUUID(),
        tempInjectElmsObj = 
        {
            className: className,
            tag: this.#wrapperElmTag,
            fullText: "",
            count: 0,
            wrapperElms: []
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
                ){ 
                    try {
                        if(this.#nodeFilterFunc(node) === true) filterFlag = NodeFilter.FILTER_ACCEPT;
                    }
                    catch (error) 
                    {
                        // FIXME add a better error message, handel stack trace
                        throw error;
                    }
                };
                return filterFlag;
            },
            null
        ); 
        // TreeWalker loop
        while (currentNode = treeWalker.nextNode()) {
            // Generate a UUID for the wrapper element id attribute
            const uuid = this.#getSafeUUID
            // Create wrapper element, set id and class attributes
            let wrapperEl = document.createElement(this.#wrapperElmTag);
            wrapperEl.setAttribute('id', uuid);
            wrapperEl.setAttribute('className', className);
            // Inject the wrapper element into DOM around the current text node
            this.#wrapChildElm(wrapperEl, currentNode);
            tempFullParsedText += wrapperEl.textContent;
            // Add the text node to the tempInjectElmsObj
            tempInjectElmsObj.wrapperElms.push({
                id: uuid,
                fullText: wrapperEl.textContent,
                wrapperNode: wrapperEl,
            });      
        }
        tempInjectElmsObj.fullText = tempFullParsedText;
        tempInjectElmsObj.count = tempInjectElmsObj.elms.length;
        return tempInjectElmsObj; 
    }
    // private methods
    /**
     * @description Generate a UUID with a prefixed underscore.
     * Can be used as a valid HTML class or id attribute.
     * 
     * @private
     * @returns {string} Returns a string that is a valid HTML class or id attribute.
     */
    #getSafeUUID(){
        return "_" + crypto.randomUUID();
    }
    /**
     * @description Inject a HTML element around another HTML element or node.
     * @private
     * @param {Element} wrapperEl - Element to be injected into DOM
     * @param {Element} childEl - the element to inject the element around
     */
    #wrapChildElm(wrapperEl, childEl) {
        if (childEl && childEl.parentNode) {
            childEl.parentNode.insertBefore(wrapperEl, childEl);
            wrapperEl.appendChild(childEl);
        }
    }
}


class TextHighlighter extends TextNodeWrapper {
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
        super();
        this.#spanIndex = 0;
        this.#wordIndex = 0;
        this.#backgroundColor = backgroundColor;
        this.#textColor = textColor;
        this.#injectElmsObj = this.wrapTextIn(selection.getRangeAt(0));

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




// #wordRangesInStr(str) { // TODO refactor name to #wordRangesInStr can move to other class that extends this class
//     let array = [],
//     match;
//     while (match = this.#regexTextContent.exec(str)) {
//         const start = match.index,
//         text = match[0],
//         end = start + match[0].length;
//         array.push({text: text ,startIndex: start, endIndex: end});
//     }
//     return array;
// }

// set regexTextContent(regexTextContent) {
//     if(!regexTextContent instanceof RegExp) throw new TypeError('SelectionElmInjector:property:regexTextContent: regex must be an instance of RegExp'); 
//     this.#regexTextContent = regexTextContent;
// }
