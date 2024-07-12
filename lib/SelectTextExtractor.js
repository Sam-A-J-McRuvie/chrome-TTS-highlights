// SelectTextExtractor.js
// TODO: UUID https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
// TODO: Rewrite method and property comments
class SelectTextExtractor {
    // Private property
    #selectionObject;
    #selectionString; 
    #selectionRange;
    #regex;    
    #classId
    #injectedTagsObj;
    // Getters
    get classId() {

        return this.#classId;
    }
    get injectedTagsObj() {
        return this.#injectedTagsObj;
    }
    /*
    * Constructor  
    * @param {Selection} selection - The selection object
    * @public
    * 
    * @throws {Error} - If the selection is undefined or null
    * @throws {Error} - If the selection is not a valid Selection object
    */
    constructor() {
        // Check if the Selection, Document and crypto are accessible 
        if (typeof Document === undefined || Document === null) {
            throw new Error('SelectTextExtractor:constructor: Document Object is undefined or null, accesses to the DOM is required');
        }else if (typeof Selection === undefined || Selection === null) {
            throw new Error('SelectTextExtractor:constructor: Selection Object is undefined or null');
        }
        else if (typeof crypto.randomUUID() === 'function') {
            throw new Error('SelectTextExtractor:constructor: Can not access Crypto interface, required for UUID generation');
        }
        this.#injectedTagsObj = {}; 
        this.#classId = crypto.randomUUID();
        this.#regex = /[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g;
    }

    // Public methods
    injectTags(selection) {
        if(typeof selection === undefined || selection === null) {
            throw new Error('SelectTextExtractor:injectTags: Passed selection object is undefined or null')
        }
        this.#selectionObject = selection;
        this.#selectionString = this.#selectionObject.toString();
        this.#selectionRange  = this.#selectionObject.getRangeAt(0);
        this.#injectedTagsObj = this.#spanTagDOMInjector();
        return this.#injectedTagsObj;
    }

    /* 
    * Node filter function
    * @param {Node} node - The node to filter
    * @returns {Number} - The filter value
    * @private
    */
    #nodeIteratorFilter(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
    }
    /* 
    * Get the nodes from the range
    * @returns {Array} - The array of nodes
    * @Private
    */
    #spanTagDOMInjector() {
        let fullText = "";
        let tempSpanIdsObj = 
        {
            classId: this.#classId,
            fullText: "",
            spans: []
        };
        let nodeIterator = document.createNodeIterator(
            this.#selectionRange.commonAncestorContainer, 
            NodeFilter.SHOW_TEXT, 
            this.#nodeIteratorFilter
        );
        let currentNode;
        while (currentNode = nodeIterator.nextNode()) {
            //FIXME: Check end of range and break
            if(this.#selectionRange.intersectsNode(currentNode)){
                // FIXME: not clean code, need to refactor. 
                if (this.#selectionString.includes(currentNode.textContent) === true){
                    // Generate a UUID and span element
                    const uuid = crypto.randomUUID();
                    let wrapperEl = document.createElement('span');
                    
                    // Set the span element attributes
                    // IDEA 
                    wrapperEl.setAttribute('id', uuid);
                    wrapperEl.setAttribute('class', this.#classId);
                    // Inject the span element into DOM 
                    this.#injectParentSpan(wrapperEl, currentNode);
                    // Add the text content to the fullText
                    fullText += wrapperEl.textContent + "\n";
                    // Get the word ranges in the span element
                    let wordRanges = this.#wordRangesInStr(wrapperEl.textContent);
                    // Add the span element to the spans array
                    tempSpanIdsObj.spans.push({
                        id: uuid,
                        fullText: wrapperEl.textContent,
                        wordCount: wordRanges.length,
                        words: wordRanges,
                    });      
                }
            }
            currentNode = nodeIterator.nextNode();
        } 
        // TODO Clear the selection text
        this.#injectedTagsObj = tempSpanIdsObj
        return this.#injectedTagsObj; 
    }

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


    #injectParentSpan(wrapper, el) {
        if (el && el.parentNode) {
          el.parentNode.insertBefore(wrapper, el);
          wrapper.appendChild(el);
        }
      }
}
