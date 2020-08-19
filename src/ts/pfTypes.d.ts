// Fucking keep up with spec ffs

interface ShadowRoot extends DocumentFragment, DocumentOrShadowRoot, InnerHTML {
    adoptedStyleSheets: CSSStyleSheet[];
    readonly host: Element;
    readonly mode: ShadowRootMode;
    /**
     * Throws a "NotSupportedError" DOMException if context object is a shadow root.
     */
}

/** A single CSS style sheet. It inherits properties and methods from its parent, StyleSheet. */
interface CSSStyleSheet extends StyleSheet {
    readonly cssRules: CSSRuleList;
    readonly ownerRule: CSSRule | null;
    readonly rules: CSSRuleList;
    addRule(selector?: string, style?: string, index?: number): number;
    deleteRule(index: number): void;
    insertRule(rule: string, index?: number): number;
    removeRule(index?: number): void;
    replace(txt: string): void;
}

declare var CSSStyleSheet: {
    prototype: CSSStyleSheet;
    new(): CSSStyleSheet;
};