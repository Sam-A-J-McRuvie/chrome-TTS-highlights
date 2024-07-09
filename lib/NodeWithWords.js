class NodeWithWords {
    // Private properties
    #node;
    #wordsArray;
    // Constructor
    constructor(node, wordsArray) {
        this.#node = node;
        this.#wordsArray = wordsArray;
    }
    // Getters
    get node() {
        return this.#node;
    }
    get wordsArray() {
        return this.#wordsArray;
    }
}
