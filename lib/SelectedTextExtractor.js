// SelectedTextExtractor.js
// TODO: UUID https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
class SelectedTextExtractor {
    // Private properties
    #selectionObject;
    #selectionString;
    #selectionRange;
    #nodesArray;

    // Getters
    get selection() {
        return this.#selectionObject;
    }

    get selectionString() {
        return this.#selectionString;
    }

    get selectionRange() {
        return this.#selectionRange;
    }

    get nodesArray() {
        return this.#nodesArray;
    }

    // Setters
    set selection(selection) {
        if (selection instanceof Selection) {
            this.#selectionObject = selection;
            this.#selectionString = this.#selectionObject.toString();
            this.#selectionRange = this.#selectionObject.getRangeAt(0);
            this.#nodesArray = this.#extractNodes();
        } else {
            throw new Error('Invalid selection object');
        }
    }

    /*
    * Constructor
    * @param {Selection} selection - The selection object
    * @public
    * 
    * @throws {Error} - If the selection is undefined or null
    * @throws {Error} - If the selection is not a valid Selection object
    */
    constructor(selection) {
        // Validate the range
        if (typeof Document === undefined || Document === null) {
            throw new Error('SelectedTextExtractor:constructor: Document Object is undefined or null, accesses to the DOM is required');
        }
        else if (typeof Selection === undefined || Selection === null) {
            throw new Error('SelectedTextExtractor:constructor: Selection Object is undefined or null');
        } else if (!(selection instanceof Selection)) {
            throw new Error('SelectedTextExtractor:constructor: Passed selection object is not an instance of Selection object');
        }

        // Set properties
        this.selection = selection;
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
    #extractNodes() {
        let nodeIterator = document.createNodeIterator(
            this.#selectionRange.commonAncestorContainer, 
            NodeFilter.SHOW_TEXT, 
            this.#nodeIteratorFilter
        );
        let nodes = [];
        let currentNode = nodeIterator.nextNode();
        /*
        idea:
            var start = range.startContainer;
            var end = range.endContainer; 
        */

        while (currentNode) {
            //FIXME: Check end of range and break
            if(this.#selectionRange.intersectsNode(currentNode)){
                // FIXME: not clean code, need to refactor. 
                if (this.#selectionString.includes(currentNode.textContent) === true){
                    // TODO: Inject span tags with uid and common class that wraps text nodes 
                    nodes.push(
                        new NodeWithWords(
                            currentNode, 
                            this.#wordsIndexesToArray(currentNode.textContent)

                            /*
                                remove nodeswith words
                                FIXME: In inject a uid object, instead of this nodes with words bollocks
                            */
                        )
                    );
                }
            }
            currentNode = nodeIterator.nextNode();
        } 
        return nodes;
    }
    /*
    * Get the array of words in String, with start and end indexes
    * @param {String} str - The string to extract the words from
    * @returns {Array} - The array of words, with start and end indexes
    * @private
    */
        #wordsIndexesToArray(str) {
            const wordRegex = /[\w.,!?;:'"“”‘’\-\(\)\[\]{}<>@#$%^&*_+=|~`]+/g;
            let array = [];
            let match;
            while (match = wordRegex.exec(str)) {
                const start = match.index;
                const word = match[0];
                const end = start + match[0].length - 1;
                array.push({word: word ,start: start, end: end});
            }
            return array;
        }
}
