/**
 * Base class for components backed by a single DOM {@link Element}.
 *
 * @typeParam E - The type of DOM element represented by the component.
 */
export abstract class Component<E extends Element = Element> {
	/**
	 * Escapes a string for safe interpolation into HTML or SVG text content.
	 *
	 * This function only escapes characters significant to markup syntax.
	 * It must not be used for JavaScript, CSS, URLs, tag names, or other
	 * non-text contexts.
	 *
	 * @param content - The text content to escape.
	 * @returns The escaped markup text.
	 */
	public static escapeMarkup(content: string): string {
		// Ampersands must be escaped first to avoid escaping generated entities.
		return content
			.replaceAll('&', "&amp;")
			.replaceAll('<', "&lt;")
			.replaceAll('>', "&gt;");
	}

	/**
	 * Escapes a string for safe interpolation into a quoted HTML or SVG
	 * attribute value.
	 *
	 * Both single and double quotes are escaped, allowing the result to be
	 * used with either quoting style.
	 *
	 * This function only protects the syntactic attribute boundary. It does
	 * not make values safe for context-sensitive attributes containing URLs,
	 * JavaScript, CSS, or other interpreted content.
	 *
	 * @param content - The attribute value to escape.
	 * @returns The escaped attribute value.
	 */
	public static escapeAttribute(content: string): string {
		// Ampersands must be escaped first to avoid escaping generated entities.
		return content
			.replaceAll('&', "&amp;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#39;")
			.replaceAll('<', "&lt;")
			.replaceAll('>', "&gt;");
	}

	/**
	 * Creates a component backed by the given DOM element.
	 *
	 * @param _element - The root DOM element represented by this component.
	 */
	protected constructor(
		protected readonly _element: E
	) {}

	/**
	 * Returns the component's root DOM element.
	 *
	 * The returned element can be inserted into the document using standard
	 * DOM APIs such as `append()`, `appendChild()`, or `replaceWith()`.
	 *
	 * @returns The root DOM element.
	 */
	public mount(): E {
		return this._element;
	}

	/**
	 * Removes the component's root element from its parent, if attached.
	 */
	public unmount(): void {
		this._element.remove();
	}
}

/**
 * Base class for components backed by a single {@link HTMLElement}.
 *
 * Components can be constructed from either an existing HTML element or an
 * HTML string containing exactly one root element.
 *
 * @typeParam E - The concrete HTML element type represented by the component.
 */
export abstract class HTMLComponent<E extends HTMLElement> extends Component<E> {
	/**
	 * Escapes a string for safe interpolation into HTML text content.
	 *
	 * @param content - The text content to escape.
	 * @returns The escaped HTML text.
	 *
	 * @see {@link Component.escapeMarkup}
	 */
	public static escapeHTML(content: string): string {
		return super.escapeMarkup(content);
	}

	/**
	 * Parses an HTML string containing exactly one root HTML element.
	 *
	 * @param content - The HTML markup to parse.
	 * @returns The root HTML element produced by the markup.
	 *
	 * @throws {@link Error}
	 * Thrown if the markup contains multiple root elements, contains no root
	 * element, or produces a root element that is not an {@link HTMLElement}.
	 */
	public static toHTML(content: string): HTMLElement {
		// <template> parses HTML without attaching the resulting nodes to the DOM.
		const fragment = document.createElement("template");
		fragment.innerHTML = content;

		// Components are required to have exactly one root element.
		if (fragment.content.childElementCount > 1)
			throw new Error("Found multiple Elements in rendered HTML");

		if (!fragment.content.firstElementChild)
			throw new Error("Failed to find Element in rendered HTML");

		if (!(fragment.content.firstElementChild instanceof HTMLElement))
			throw new Error("Rendered Element is not an instance of HTMLElement");

		return fragment.content.firstElementChild as HTMLElement;
	}

	/**
	 * Creates an HTML component from an existing element or an HTML string.
	 *
	 * When a string is provided, it is parsed using {@link HTMLComponent.toHTML}.
	 *
	 * @param _element - An existing HTML element or markup containing exactly
	 * one root HTML element.
	 */
	public constructor(
		_element: E | string
	) {
		if (_element instanceof HTMLElement)
			super(_element);
		else
			super(HTMLComponent.toHTML(_element) as E);
	}
}

/**
 * Base class for components backed by a single {@link SVGElement}.
 *
 * Components can be constructed from either an existing SVG element or an
 * SVG string containing exactly one root element.
 *
 * @typeParam E - The concrete SVG element type represented by the component.
 */
export abstract class SVGComponent<E extends SVGElement> extends Component<E> {
	/**
	 * Escapes a string for safe interpolation into SVG text content.
	 *
	 * @param content - The text content to escape.
	 * @returns The escaped SVG text.
	 *
	 * @see {@link Component.escapeMarkup}
	 */
	public static escapeSVG(content: string): string {
		return super.escapeMarkup(content);
	}

	/**
	 * Parses an SVG string containing exactly one root SVG element.
	 *
	 * The markup is parsed inside a temporary SVG element to ensure that its
	 * children are created in the SVG namespace.
	 *
	 * @param content - The SVG markup to parse.
	 * @returns The root SVG element produced by the markup.
	 *
	 * @throws {@link Error}
	 * Thrown if the markup contains multiple root elements, contains no root
	 * element, or produces a root element that is not an {@link SVGElement}.
	 */
	public static toSVG(content: string): SVGElement {
		// Parsing within an SVG root creates descendants in the SVG namespace.
		const svg = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"svg"
		);

		svg.innerHTML = content;

		// Components are required to have exactly one root element.
		if (svg.childElementCount > 1)
			throw new Error("Found multiple Elements in rendered SVG");

		if (!svg.firstElementChild)
			throw new Error("Failed to find Element in rendered SVG");

		if (!(svg.firstElementChild instanceof SVGElement))
			throw new Error("Rendered Element is not an instance of SVGElement");

		return svg.firstElementChild as SVGElement;
	}

	/**
	 * Creates an SVG component from an existing element or an SVG string.
	 *
	 * When a string is provided, it is parsed using {@link SVGComponent.toSVG}.
	 *
	 * @param _element - An existing SVG element or markup containing exactly
	 * one root SVG element.
	 */
	public constructor(
		_element: E | string
	) {
		if (_element instanceof SVGElement)
			super(_element);
		else
			super(SVGComponent.toSVG(_element) as E);
	}
}