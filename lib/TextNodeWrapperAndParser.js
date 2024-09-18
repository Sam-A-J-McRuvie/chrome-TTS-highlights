
class TextNodeWrapperAndParser {
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
    set wrapperElmTag(wrapperElmTag) { 
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
        className = this.getSafeUUID(),
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
                    && this.#nodeFilterFunc(node) === true // Custom filter function, can fail if the function throws an error
                ){ 

                    filterFlag = NodeFilter.FILTER_ACCEPT;
                };
                return filterFlag;
            },
            null
        ); 
        // TreeWalker loop
        while (currentNode = treeWalker.nextNode()) {
            // Generate a UUID for the wrapper element id attribute
            const uuid = this.getSafeUUID
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
    getSafeUUID(){
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

class SelectionTextHighlighter {

    #injectedSpansObj = null;

    #spanIndex = null;

    #highlightsCss = {
        backgroundColor: "yellow",
        textColor: "black",
        highlightName: "highlight"
    }

    #injectorObject = null;

    constructor(backgroundColor, textColor) {
        if(Selection === undefined || Selection === null) {
            throw new Error("Selection object is not available, cannot proceed.");
        } else if (!this.#isHexColor(backgroundColor)) {
            throw new Error("Invalid background color, must be a hex color");
        } else if (!this.#isHexColor(textColor)) {
            throw new Error("Invalid text color, must be a hex color");
        }
        this.#injectorObject = new TextNodeWrapperAndParser();
        this.#highlightsCss.backgroundColor = backgroundColor;
        this.#highlightsCss.textColor = textColor;
        this.#highlightsCss.highlightName = this.#injectorObject.getSafeUUID();
        let sheet = document.styleSheets[0];
        sheet.insertRule(`
            ::highlight(${this.#highlightsCss.highlightName}) {
                background-color: ${this.#highlightsCss.backgroundColor};
                color: ${this.#highlightsCss.textColor};
            }`, sheet.cssRules.length);
    }

    injectHighlighterSpans(selection) { // TODO rename 
        if (!selection instanceof Selection) {
            throw new TypeError("Parameter selection must be a Selection object.");
        } else if (selection.rangeCount <= 0) {
            throw new Error("Selection object has no ranges.");
        }
        this.#injectedSpansObj = this.#injectorObject.wrapTextIn(range);
    }

    nextSpan() {
        if (this.#spanIndex < this.#injectedSpansObj.count - 1) {
            this.#spanIndex++;
            return true;
        }
        return false;
    }

    previousSpan() {
        if (this.#spanIndex > 0) {
            this.#spanIndex--;
            return true;
        }
        return false;
    }

    getSpanText() {
        return this.#injectedSpansObj.elms[this.#spanIndex].fullText;
    }

    highlightWordAtIndex(index) { // TODO build method
        if (index < 0 || index >= this.#injectedSpansObj.count) {
            throw new RangeError("Index out of bounds.");
        }
        let span = document.getElementById(this.#injectedSpansObj.wrapperElms[index].id);
        if (span === null || span === undefined) {
            throw new Error("Span not found.");
        }
        // TODO implement highlight, need to find end of word being read
        const range = document.createRange();
        range.setStart(span, index);
        range.setEnd(span, index + span.textContent.length); 
        const highlight = new Highlight(range);
        CSS.highlights.set(highlight);
    }

    clearAllHighlights() {
        CSS.highlights.clear();
    }

    removeAllSpans() { 
        this.#injectedSpansObj.wrapperElms.forEach((elm) => {
            let span = document.getElementById(elm.id);
            span.parentNode.replaceChild(span.firstChild, span);
        });
    }

    #isHexColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }
}
