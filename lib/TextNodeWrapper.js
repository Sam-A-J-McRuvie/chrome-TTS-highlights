class TextNodeWrapper {

    // private properties
    
    /**
     * The HTML tag to be injected.
     *
     * @type {string}
     */
    #wrapperElmTag;

    
    /**
     * @description placeholder
     * @private
     * @type {function}
     * @param {object} node - The text node to be checked.
     * @returns {boolean} Returns true if the node is accepted, false otherwise.
     * @default (node) => { return true; }
     */
    #nodeFilterFunc = (node) => {
        return true;
    }    
    
    #validElmTags = ['span', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']; 

    #errorMessages = {
        nodeFilterFunc: 'Example: (node) => { return true; }\nParameters: node - the text node to be check.\nReturn: a boolean value. True to accept the node, false to reject it.',
        initialization: 'Initialization, access to the DOM is required. Document Object is undefined or null.',
    }

    // Public setters 
    set wrapperElmTag(wrapperElmTag) {
        if(!this.isValidElmTags(wrapperElmTag)) throw new RangeError(`Invalid HTML tag, accepted values are: ${this.#validElmTags}`);
        this.#wrapperElmTag = wrapperElmTag;
    }

    
    
    set nodeFilterFunc(filter) {
        if(typeof filter !== 'function') throw new TypeError(`Function expected, ${typeof filter} given.\n${this.#errorMessages.nodeFilterFunc}`);
        if(filter.length !== 1) throw new Error(`Function must have one parameter, ${filter.length} given.\n
            ${this.#errorMessages.nodeFilterFunc}`);
        this.#nodeFilterFunc = filter;
    }

    set validElmTags(tags) {
        // Check if the tags are an array of strings
        if(!Array.isArray(tags)) {
            throw new TypeError(`Array expected, ${typeof tags} given.`);
        } else if (tags.length <= 0) {
            throw new Error('Array empty, must contain at least one element.');
        }
        // TODO: Check if the tags are valid HTML tags with foreach loop
        tags.forEach((tag, i) => {
            if(typeof tag !== 'string'){
                throw new TypeError(`Element at index ${i} is not a string. Expected string, ${typeof tag} given.`);
            } else if (tag.length <= 0) {
                throw new Error(`Element at index ${i} is an empty string.`);
            }
            const parser = new DOMParser().parseFromString(`<${tag}>test</${tag}>`, 'text/html');
            const parseError = parser.documentElement.querySelector('parsererror');
            if(parseError !== null) {
                throw new Error(`Element at index ${i} is not a valid HTML tag. Tag at index: ${tag}.`);
            }
        });
        this.#validElmTags = tags;
    }
    // public getters
    /**
     * @description Get the HTML tag used for wrapping the text nodes.
     * 
     * @type {string}
    **/     
    get wrapperElmTag() {
        return this.#wrapperElmTag;
    }
    /**
     * @description Get the function that filters the text nodes.
     * 
     * @type {function} 
     * @default (node) => { return true; }
     */
    get nodeFilterFunc() {
        return this.#nodeFilterFunc;
    } 
    /**
     * Get the valid HTML tags that can be injected into the DOM.
     *
     * @type {string[]}
     * @default 'span', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
     */
    get validElmTags() {
        return this.#validElmTags;
    }
    /**
     * @param {string} wrapperElmTag - The HTML tag to be injected.
     * @throws {Error} - If Document is undefined or null.
     */
    constructor(wrapperElmTag) {
        // Check if the Selection, Document and crypto are accessible.
        if (typeof Document === undefined) {
            throw new Error(this.#errorMessages.initialization);
        } else if(Document === null){
            throw new Error(this.#errorMessages.initialization);
        }
        // Initialize the private properties
        this.wrapperElmTag = wrapperElmTag;
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
                ){ 
                    try {
                        if(this.#nodeFilterFunc(node) === true) filterFlag = NodeFilter.FILTER_ACCEPT;
                    }
                    catch (error) {
                        throw new Error(`Failed execution of user defined function nodeFilterFunc.\nFunction error message: ${error.message}`);
                    }
                };
                return filterFlag;
            },
            null
        ); 
        // NodeIterator loop
        while (currentNode = treeWalker.nextNode()) {
            // Generate a UUID and wrapper element
            const uuid = this.#getSafeUUID
            // Create wrapper element, set id and class attributes
            let wrapperEl = document.createElement(this.#wrapperElmTag);
            wrapperEl.setAttribute('id', uuid);
            wrapperEl.setAttribute('className', className);
            // Inject the wrapper element into DOM around the current text node
            this.#wrapChildElm(wrapperEl, currentNode);
            tempFullParsedText += wrapperEl.textContent;
            // Get the word ranges in the wrapper element
            tempInjectElmsObj.elms.push({
                id: uuid,
                fullText: wrapperEl.textContent,
            });      
        }
        tempInjectElmsObj.fullText = tempFullParsedText;
        tempInjectElmsObj.count = tempInjectElmsObj.elms.length;
        return tempInjectElmsObj; 
    }
    /**
     * @description Check if a string is a valid HTML tag in validElmTags array property.
     * @public
     * @param {string} tag - The string to be checked.
     * @returns {boolean} Returns true if the string is a valid HTML tag, false otherwise.
     */
    isValidElmTags(tag) {
        let isValid = false;
        if(typeof tag !== 'string') return isValid;
        isValid = this.#validElmTags.some((str) => {
            return str === tag;
        });
        return isValid;
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
        super("span", /[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g);
        this.#spanIndex = 0;
        this.#wordIndex = 0;
        this.#backgroundColor = backgroundColor;
        this.#textColor = textColor;
        this.#customHighlightName = 'a'+crypto.randomUUID();
        this._validElmTags = ['span', 'div', "2", 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
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
