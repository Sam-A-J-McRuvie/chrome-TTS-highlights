
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
    wrapTextIn(range) { // p1 issue range having the same text node start as end, isues is in common ancestor container. Will need to check if the range has make a condition.
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

class CSSHighlightHandler { // p1 highlights not applying to dom elements

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
        this.#highlightName =  this.getSafeUUID;
        this.#styleSheet = new CSSStyleSheet();
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.#styleSheet];
        this.#highlight = new Highlight();
        CSS.highlights.set(this.#highlightName, this.#highlight);
    }

    setStyle(color, backgroundColor) {
        if(!this.isHexColor(color) || !this.isHexColor(backgroundColor)) {
            throw new Error(`Invalid color or backgroundColor, ${color} or ${backgroundColor} given.`);
        }
        this.#styleSheet.replaceSync(`
            ::highlight(${this.#highlightName}) {
                color: ${color};
                background-color: ${backgroundColor};
        }`);
    }

    addHighlight(range) {
        if (!range instanceof Range) {
            throw new TypeError(`Parameter range must be a Range object, ${typeof range} given.`);
        }
        this.#highlight.add(range); // p1 not being applied to the dom
    }

    clearHighlights() {
        this.#highlight.clear();
        this.#ranges = [];
    }

    removeHighlight(i) { // p2 remove highlight by index, pass range, remove by range
        if(i < 0|| i > this.#ranges.size) {
            throw new RangeError(`Index out of range, ${i} given, ${this.#ranges.size} expected.`);
        }
        this.#highlight.delete(this.#ranges[i]);
        this.#ranges.splice(i, 1);
    }

    getSafeUUID(){
        return "_" + crypto.randomUUID();
    }
    
    isHexColor(color) {
        if (typeof color !== 'string') {
            return false;
        }else if (color.length !== 7) {
            return false;
        }
        return /^#[0-9A-F]{6}$/i.test(color);
    }
}

// create style sheet https://fullystacked.net/constructable/
// highlight register https://developer.mozilla.org/en-US/docs/Web/API/HighlightRegistry#examples
// So that all DOM highlights don't get cleared. 
// Only the highlights that are registered by this class.
// IDEA Possibly make a class static? need to look into it. 
class HighlighterWalker {

    #injectedSpans = null;

    #spanIndex = 0;

    #textNodeWrapper;

    #highlighter;

    constructor() { 
        this.#textNodeWrapper = new TextNodeWrapper();
        this.#highlighter = new CSSHighlightHandler();
        this.#highlighter.setStyle('#000000', '#FFFF00');
    }

    setStyle(color, backgroundColor) {
        this.#highlighter.setStyle(color, backgroundColor);
    }

    highlightIn(range) {
        this.#injectedSpans = this.#textNodeWrapper.wrapTextIn(range);
        console.log(this.#injectedSpans);
        return true;
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
        return this.#injectedSpans.elms[this.#spanIndex].text;
    }

    highlightBetween(indexStart, indexEnd) { 
        if(this.#injectedSpans === null 
            || (indexStart < 1 || indexEnd < 0 || indexStart >= indexEnd)
        ) {
            return false;
        }else if (indexEnd > this.#injectedSpans.wrapperElms[this.#spanIndex].text.length) {
            return false;
        }
        // light the text between the indexes
        let span = document.getElementById(this.#injectedSpans.wrapperElms[this.#spanIndex].id).firstChild;
        const range = document.createRange();
        range.setStart(span, indexStart);
        range.setEnd(span, indexEnd);
        this.#highlighter.addHighlight(range);
        return true;
    }


    removeSpans() { 
        if(this.#injectedSpans === null) {
            this.#injectedSpans.wrapperElms.forEach((elm) => {
                let span = document.getElementById(elm.id);
                span.parentNode.replaceChild(span.firstChild, span);
            });
            this.#injectedSpans = null;
        }
    }

}

