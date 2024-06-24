class SelectionTextNodeExtractor {
    // Private property
    #selection;
    #selectionString;
    #selectionRange;
    // Public properties

    /*
    * Constructor
    * @param {Selection} selection - The selection object
    * @public
    * @throws {Error} - If the selection is undefined or null
    * @throws {Error} - If the selection is not a valid Selection object
    */
    constructor(selection) {
        // Validate the range
        if (typeof Selection === undefined || Selection === null) {
            throw new Error('RangeNodeExtractor:constructor: election is undefined or null');
        }else if (selection instanceof Selection === false) {
            throw new Error('RangeNodeExtractor:constructor: selection is not a valid Range object');
        }
        // Set private property
        this.#selection = selection;
        this.#selectionString = this.#selection.toString();
        this.#selectionRange = this.#selection.getRangeAt(0);
    }
    /* 
    * Get the range object
    * @returns {Range} - The range object
    * @public
    */
    getRange() {
        return this.#selectionRange;
    }
    /* 
    * Node filter function
    * @param {Node} node - The node to filter
    * @returns {Number} - The filter value
    * @private
    */
    #nodeFilter(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
    }
    /* 
    * Get the nodes from the range
    * @returns {Array} - The array of nodes
    * @public
    */
    getNodes() {
        let nodeIterator = document.createNodeIterator(
            this.#selectionRange.commonAncestorContainer, 
            NodeFilter.SHOW_TEXT, 
            this.#nodeFilter
        );
        let nodes = [];
        let currentNode = nodeIterator.nextNode();
        while (currentNode) {
            //TODO: Check end of range and break
            if(this.#selectionRange.intersectsNode(currentNode)){
                // TODO: not clean code, need to refactor. 
                if (this.#selectionString.includes(currentNode.textContent) === true){
                    nodes.push(currentNode);
                }
            }
            currentNode = nodeIterator.nextNode();
        }
        return nodes;
    }
}
