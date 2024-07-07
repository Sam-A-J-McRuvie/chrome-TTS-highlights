class NodesHighlighter {
    // private properties
    #nodesToRead;
    #currentNodeIndex;
    #currentWordIndex;
    #endNodeIndex;
    #endWordIndex;
    // Constructor
    constructor() {
        this.#nodesToRead = [];
        this.#currentNodeIndex = 0;
        this.#endNodeIndex = 0;
        this.#endWordIndex = 0;
    }
    // Setters
    set nodesToRead(nodes) {
        // FIXME: Checks not required in production, useful for development lib release only
        if(Array.isArray(nodes) === false) {
            throw new Error('readingHighlighter:setNodesToRead: Passed nodes is not an array');
        }else if(nodes.length === 0){
            throw new Error('readingHighlighter:setNodesToRead: Passed nodes array is empty');
        } else if (nodes.every(node => node instanceof NodeWithWords) === false) {
            throw new Error('readingHighlighter:setNodesToRead: Passed nodes array contains non-NodeWithWords objects');
        }
        this.#nodesToRead = nodes;
        this.#endNodeIndex = this.#nodesToRead.length - 1;
        this.#endWordIndex = this.#nodesToRead[this.#endNodeIndex].wordsArray.length - 1;
        this.#currentNodeIndex = 0;
        this.#currentWordIndex = 0;
    }
    // Public methods
    nextWord() {
        if (this.#currentNodeIndex > this.#endNodeIndex || this.#currentNodeIndex === this.#endNodeIndex) {
            return null;
        } 

        const currentNode = this.#nodesToRead[this.#currentNodeIndex];
        const currentWord = currentNode.wordsArray[this.#currentWordIndex];
        if (this.#currentWordIndex < currentNode.wordsArray.length - 1) {
            this.#currentWordIndex++;
        } else {
            this.#currentNodeIndex++;
            this.#currentWordIndex = 0;
        }
        return currentWord;
    }
    /*
    * Reset the current node and word index to 0 and clear all highlights in the document
    */
    reset() {
        this.#currentNodeIndex = 0;
        this.#currentWordIndex = 0;
        this.#clearAllHighlights();
    }       
    // TODO: Needs built and testing
    #highlightWord() {
        let reading = this.#nodesToRead[this.#currentNodeIndex];

        
        let range = document.createRange();
        range.setStart(node.node, node.wordsArray);
        range.setEnd(node.node, node.wordsArray);
        let span = document.createElement('span');
        span.classList.add('reading-highlight');
        range.surroundContents(span);
    }
    // TODO: needs built and testing
    #clearAllHighlights() {
        let highlighted = document.querySelectorAll('.reading-highlight');
        highlighted.forEach(node => {
            node.classList.remove('reading-highlight');
        });
    }
    // TODO: needs built and testing
    #cleanCurrentNodeHighlights() {
        let node = this.#nodesToRead[this.#currentNodeIndex];
        let highlighted = node.node.querySelectorAll('.reading-highlight');
        highlighted.forEach(node => {
            node.classList.remove('reading-highlight');
        });
    }
}
