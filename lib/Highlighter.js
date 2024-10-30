class Highlighter {
    // todo jsdocs

    #highlightName;

    #styleSheet;

    constructor() {
        if (typeof Document === undefined) {
            throw new Error(`Document is undefined, Document is required.`);
        } else if (Document === null) {
            throw new Error(`Document is null, Document is required.`);
        }
        this.#highlightName = Highlighter.cssSafeUUID();
        // Create a new CSSStyleSheet object and add it to the document
        this.#styleSheet = new CSSStyleSheet();
        this.setStyle("#FFFF00");
        document.adoptedStyleSheets = [
            ...document.adoptedStyleSheets,
            this.#styleSheet,
        ];
    }

    setStyle(backgroundColor = "inherit", color = "inherit") {
        if (
            (!Highlighter.isHexColor(color) && color !== "inherit") ||
            (!Highlighter.isHexColor(backgroundColor) &&
                backgroundColor !== "color")
        ) {
            throw new Error(
                `Invalid color or backgroundColor, must be a string representing a HEX color value with a leading '#' character.`
            );
        }
        this.#styleSheet.replaceSync(`
            ::highlight(${this.#highlightName}) {
                color: ${color};
                background-color: ${backgroundColor};
            }
        `);
    }

    setHighlight(range) {
        if (!range instanceof Range) {
            throw new TypeError(
                `Parameter range must be a Range object, ${typeof range} given.`
            );
        }
        this.removeHighlight();
        CSS.highlights.set(this.#highlightName, new Highlight(range));
    }

    removeHighlight() {
        return CSS.highlights.delete(this.#highlightName);
    }

    static cssSafeUUID() {
        return "_" + crypto.randomUUID();
    }

    static isHexColor(color) {
        if (typeof color !== "string") {
            return false;
        } else if (color.length !== 7) {
            return false;
        }
        return /^#[0-9A-F]{6}$/i.test(color);
    }

    static parseTextNodes(range) {
        // bug handel single text node
        if (!range instanceof Range) {
            throw new TypeError(
                `Parameter range must be a Range object, ${typeof range} given.`
            );
        } else if (range.collapsed === true) {
            throw new Error(
                "Parameter range is collapsed, range must be a non-collapsed range."
            );
        }
        let currentNode,
            tempNodeArr = [],
            treeWalker = document.createTreeWalker(
                range.commonAncestorContainer,
                NodeFilter.SHOW_TEXT,
                (node) => {
                    // only take visible text nodes
                    let filterFlag = NodeFilter.FILTER_REJECT;
                    if (
                        node.parentElement.checkVisibility({
                            contentVisibilityAuto: true,
                            opacityProperty: true,
                            visibilityProperty: true,
                            checkOpacity: true,
                            checkVisibilityCSS: true,
                        }) === true &&
                        !/^\s*$/g.exec(node.textContent) &&
                        range.intersectsNode(node)
                    ) {
                        filterFlag = NodeFilter.FILTER_ACCEPT;
                    }
                    return filterFlag;
                },
                null
            );
        while ((currentNode = treeWalker.nextNode())) {
            tempNodeArr.push(currentNode);
        }
        return tempNodeArr;
    }
}
