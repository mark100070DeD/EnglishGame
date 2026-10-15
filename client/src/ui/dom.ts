/** Root element for DOM UI rendered above the game canvas. */
export function getUiRoot(): HTMLElement {
  const root = document.getElementById('ui-root');
  if (!root) throw new Error('#ui-root element is missing in index.html');
  return root;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
