/** A clickable/tappable object in the world: a door, an NPC, etc. */
export interface Hotspot {
  readonly id: string;
  readonly target: Phaser.GameObjects.Image;
  /** Caption shown above the object while it is hovered or pressed. */
  readonly label: string;
  onActivate(): void;
}

/** Vertical extent of an object in world coordinates; the label is placed above it, or below if there is no room. */
export interface WorldAnchor {
  x: number;
  top: number;
  bottom: number;
}

/** Where the hotspot system shows its caption. Implemented by the UI layer. */
export interface HotspotLabelView {
  show(text: string, anchor: WorldAnchor): void;
  hide(): void;
}
