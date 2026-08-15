# Component

A simple Component Wrapper for the Web

## Installation

```bash
npm install @serum-enterprises/component
```

## Usage

### HTML Components

You can extend `HTMLComponent` to create a component backed by an `HTMLElement`.

```ts
import {HTMLComponent} from "@serum-enterprises/component";

export class Button extends HTMLComponent<HTMLButtonElement> {
	public constructor(
		public readonly label: string
	) {
		super(`
			<button type="button">
				${HTMLComponent.escapeHTML(label)}
			</button>
		`);

		this._element.addEventListener("click", this._onClick);
	}

	// Note that _onClick has to be a Property rather than a Method to bind `this` properly
	private _onClick = () => {
		console.log(`The Button with Label ${this.label} has been clicked`);
	}
}
```

You can then mount the resulting element using the native DOM API:

```ts
const button = new Button("Hello World");
document.body.append(button.mount());
```

and also remove it again with

```ts
button.unmount();
```

An existing element can also be wrapped directly:

```ts
class Button extends HTMLComponent<HTMLButtonElement> {
	public constructor(
		element: HTMLButtonElement
	) {
		super(element);

		this._element.addEventListener("click", this._onClick);
	}

	// Note that _onClick has to be a Property rather than a Method to bind `this` properly
	private readonly _onClick = () => {
		this.unmount();
	}
}

const element = document.createElement("button");

element.textContent = "Hello World";

const button = new Button(element);
```

When the Button is clicked on the above example, the element will remove be removed from the DOM. Note that as long as
both Element and Component have references to them, they will NOT get garbage collected, and neither will the Event
Listener.

### SVG Components

SVGComponent provides the same abstraction for SVG elements.

```ts
export class Circle extends SVGComponent<SVGCircleElement> {
	public constructor(
		cx: number,
		cy: number,
		radius: number
	) {
		super(`
			<circle
				cx="${cx}"
				cy="${cy}"
				r="${radius}"
			/>
		`);
	}
}
```

The resulting SVG element can be mounted normally:

```ts
const svg = document.querySelector("svg");

const circle = new Circle(50, 50, 25);

svg?.append(circle.mount());
```

### Escaping Content

When interpolating untrusted or dynamic text into markup strings, you should escape it before parsing the markup.

For HTML:

```ts
const name = "<John & Jane>";
const content = `
	<span>
		${HTMLComponent.escapeHTML(name)}
	</span>
`;
```

For SVG:

```ts
const label = "<Example>";
const content = `
	<text>
		${SVGComponent.escapeSVG(label)}
	</text>
`;
```

For quoted attribute values, use escapeAttribute:

```ts
const title = `John's "Component"`;
const content = `
	<div title="${HTMLComponent.escapeAttribute(title)}">
		Example
	</div>
`;
```

`escapeHTML`, `escapeSVG`, and `escapeAttribute` protect markup syntax only. They do NOT make arbitrary values safe for
JavaScript, CSS, URLs, element names, or attribute names.

Whenever possible, prefer native DOM APIs such as `textContent` and `setAttribute` when working directly with elements.

### Parsing Markup

HTML markup can be converted directly into an `HTMLElement`:

```ts
const element = HTMLComponent.toHTML(`
	<div class="example">
		Hello World
	</div>
`);
```

SVG markup can similarly be converted into an SVGElement:

```ts
const element = SVGComponent.toSVG(`
	<circle cx="50" cy="50" r="25" />
`);
```

A component must have exactly one root element. Parsing markup containing no root element or multiple root elements
throws an Error. Note that invalid or broken HTML might still parse. Additionally, `toHTML` and `toSVG` do NOT typecheck
their result. The same goes for `HTMLComponent` and `SVGComponent`.

Therefore, this is completely possible but very dangerous to do:

```ts
class Button extends HTMLComponent<HTMLButtonElement> {
	public constructor() {
		super(`
		    <span>This should be a Button</span>
		`);
	}
}
```

### Component

Component is the common base class behind HTML and SVG components.

```ts
abstract class MyComponent<E extends Element> extends Component<E> {
	// ...
}
```

Every component wraps exactly one DOM Element.

### `mount()`

Returns the wrapped element:

```ts
const element = component.mount();
```

It does not automatically insert the element into the document. This keeps mounting compatible with the standard DOM
API:

```ts
container.append(component.mount());
```

### `unmount()`

Removes the wrapped element from its parent:

```ts
component.unmount();
```

Calling `unmount()` on an element that is not currently attached to the DOM is safe.

## Browser Only

This package is designed exclusively for browser environments.

It depends on browser DOM APIs such as:

* `Element`
* `HTMLElement`
* `SVGElement`
* `document`

The package is published as ESM only and does not provide a CommonJS build.

```ts

import {Component, HTMLComponent, SVGComponent} from "@serum-enterprises/component";
```

Attempting to load the package through its Node.js export throws an error indicating that the package is browser-only.

## Design

The library intentionally provides only a small abstraction over the native DOM.

It does not provide:

* a virtual DOM
* reactive state
* template compilation
* DOM diffing
* automatic rendering
* lifecycle hooks
* a templating language

Components remain ordinary TypeScript classes backed by ordinary DOM elements. Rendering, event handling, state
management, and application architecture remain under the control of the application.

## Requirements

A modern browser with ES2022 and DOM support is recommended.

## License

MIT License

Copyright (c) 2026 Serum Enterprises L.L.C-FZ

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM,
OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.