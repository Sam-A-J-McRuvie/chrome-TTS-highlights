
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
            throw new Error(`Document object is not available.`);
        } else if(Document === null){
            throw new Error(`Document object is null.`);
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
            const uuid = this.getSafeUUID();
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
                text: wrapperEl.textContent,
            });      
        }
        tempInjectElmsObj.fullText = tempFullParsedText;
        tempInjectElmsObj.count = tempInjectElmsObj.wrapperElms.length;
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
 
// p1 Use css highlight register
// create style sheet https://fullystacked.net/constructable/
// highlight register https://developer.mozilla.org/en-US/docs/Web/API/HighlightRegistry#examples
// So that all DOM highlights don't get cleared. 
// Only the highlights that are registered by this class.
// IDEA Possibly make a class static? need to look into it. 
class textHighlighter {

    #injectedSpans = null;

    #spanIndex = 0;

    #cssStyles = {
        highlighter: {
            name: "highlight", 
            textColor: "black",
            backgroundColor: "yellow"
            
        }
    }
    
    #textNodeWrapper = new TextNodeWrapper();

    constructor() { 

        // insert highlight into CSS styles
        let sheet = document.styleSheets[0];
        this.#cssStyles.highlighter.name = this.#textNodeWrapper.getSafeUUID();
        this.#cssStyles.highlighter.textColor = textColor;
        this.#cssStyles.highlighter.backgroundColor = backgroundColor;

        sheet.insertRule(`
            ::highlight(${this.#cssStyles.highlighter.name}) {
                background-color: ${this.#cssStyles.highlighter.backgroundColor};
                color: ${this.#cssStyles.highlighter.textColor};
            }`, sheet.cssRules.length);
    }

    highlightIn(range) {
        try {
            this.removeInjectedSpans();
            this.#injectedSpans = this.#textNodeWrapper.wrapTextIn(range);
            return true;
        }
        catch(error) {
            console.error(error);
            return false;
        }
    }

    next() {
        if (this.#spanIndex < this.#injectedSpans.count - 1) {
            this.#spanIndex++;
            return true;
        }
        return false;
    }

    previous() { 
        if (this.#spanIndex > 0) {
            this.#spanIndex--;
            return true;
        }
        return false;
    }

    currentText() {
        if(this.#injectedSpans === null) {
            return false;
        }
        return this.#injectedSpans.elms[this.#spanIndex].fullText;
    }

    highlightBetween(indexStart, indexEnd) { 
        if(this.#injectedSpans === null 
            || (indexStart < 1 || indexEnd < 0 || indexStart >= indexEnd)
        ) {
            return false;
        }else if (indexEnd > this.#injectedSpans.wrapperElms[this.#spanIndex].fullText.length) {
            return false;
        }
        this.clearHighlights();
        // light the text between the indexes
        let span = document.getElementById(this.#injectedSpans.wrapperElms[this.#spanIndex].id).firstChild;
        const range = document.createRange();
        range.setStart(span, indexStart);
        range.setEnd(span, indexEnd); 
        const highlight = new Highlight(range);
        CSS.highlights.set(this.#cssStyles.highlighter.name, highlight);
        return true;
    }

    clearHighlights() {
        CSS.highlights.clear();
    }

    removeInjectedSpans() { 
        if(this.#injectedSpans === null) {
            this.#injectedSpans.wrapperElms.forEach((elm) => {
                let span = document.getElementById(elm.id);
                span.parentNode.replaceChild(span.firstChild, span);
            });
            this.#injectedSpans = null;
        }
    }

}

// p1: create class for handling css injection
class CSSHighlightHandler {

    #highlightName;

    #highlight;

    #ranges = [];

    #styleSheet;

    constructor() {
        // check if the Document object is available, if not throw an error
        if (typeof Document === undefined) {
            throw new Error(`Document object is not available.`);
        } else if(Document === null){
            throw new Error(`Document object is null.`);
        }
        this.#highlightName = this.#getSafeUUID();
        this.#styleSheet = new CSSStyleSheet();
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.#styleSheet];
        this.#highlight = new Highlight();
        CSS.highlights.set(highlightName, this.#highlight);
    }

    setStyle(color, backgroundColor) {
        if(typeof color !== 'string' || typeof backgroundColor !== 'string') {
            throw new TypeError(`color, backgroundColor, textDecoration, and textShadow arguments must be strings.`);
        }else if(!this.#isHexColor(color) || !this.#isHexColor(backgroundColor)) {
            throw new Error(`color and backgroundColor arguments must be valid hex color strings.`);
        }
        this.#styleSheet.replaceSync(`
            ::highlight(${this.#highlightName}) {
                color: ${color};
                background-color: ${backgroundColor};
        }`);
    }

    addHighlight(range) {
        this.#highlight.add(range);
        this.#highlight.add(range);
    }

    clearHighlights() {
        this.#highlight.clear(range);
    }

    removeHighlight(i) {
        if(i < 0|| i > this.#highlight.size) {
            throw new RangeError(`Index out of range, ${i} given, ${this.#ranges.size} expected.`);
        }
        this.#highlight.delete(this.#ranges[i]);
        // p1 remove the range from the ranges array
    }

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
    

    #isHexColor(color) {
        if (typeof color !== 'string') {
            return false;
        }else if (color.length !== 7) {
            return false;
        }
        return /^#[0-9A-F]{6}$/i.test(color);
    }
}
