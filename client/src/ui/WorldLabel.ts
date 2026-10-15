import type { HotspotLabelView, WorldAnchor } from '../systems/interaction/Hotspot';
import { createElement } from './dom';

/** Converts a world point to browser viewport (client) coordinates. */
export type WorldToClient = (x: number, y: number) => { x: number; y: number };

/**
 * Caption pinned to a world object (not to the cursor). Rendered in the DOM
 * so text stays crisp at any canvas scale.
 */
export class WorldLabel implements HotspotLabelView {
  private readonly element = createElement('div', 'world-label');
  private anchor: WorldAnchor | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly worldToClient: WorldToClient,
  ) {
    this.element.hidden = true;
    root.append(this.element);
  }

  show(text: string, anchor: WorldAnchor): void {
    this.anchor = anchor;
    this.element.textContent = text;
    this.element.hidden = false;
    this.reposition();
  }

  hide(): void {
    this.anchor = null;
    this.element.hidden = true;
  }

  /** Re-applies the position, e.g. after the canvas was resized. */
  reposition(): void {
    if (!this.anchor) return;
    const rootRect = this.root.getBoundingClientRect();
    const top = this.worldToClient(this.anchor.x, this.anchor.top);
    const bottom = this.worldToClient(this.anchor.x, this.anchor.bottom);

    // Flip below the object when there is no room above it.
    const fitsAbove = top.y - rootRect.top - this.element.offsetHeight - 8 >= 0;
    this.element.classList.toggle('world-label--below', !fitsAbove);
    this.element.style.left = `${top.x - rootRect.left}px`;
    this.element.style.top = `${(fitsAbove ? top.y : bottom.y) - rootRect.top}px`;
  }

  destroy(): void {
    this.element.remove();
  }
}
