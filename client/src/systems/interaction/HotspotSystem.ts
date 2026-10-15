import Phaser from 'phaser';
import type { Hotspot, HotspotLabelView } from './Hotspot';
import { applyHighlight } from './highlight';

interface Entry {
  hotspot: Hotspot;
  /** Padded hit rectangle in world coordinates. */
  hitBounds: Phaser.Geom.Rectangle;
}

/**
 * Point-and-click interaction for mouse and touch.
 *
 * - Mouse: hover highlights and shows the label; click activates.
 * - Touch: pressing highlights and shows the label; releasing on the same hotspot activates.
 *
 * Activation happens on release, and only if the press also started on that hotspot,
 * so dragging a finger across the screen never triggers a transition.
 */
export class HotspotSystem {
  private readonly entries = new Map<string, Entry>();
  private focused: Entry | null = null;
  private clearHighlight: (() => void) | null = null;
  private enabled = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly labelView: HotspotLabelView,
    private readonly hitPadding: number,
  ) {
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onScenePointerDown, this);
  }

  register(hotspot: Hotspot): void {
    if (this.entries.has(hotspot.id)) throw new Error(`Hotspot "${hotspot.id}" is already registered`);

    const { target } = hotspot;
    const pad = this.hitPadding;
    const entry: Entry = {
      hotspot,
      hitBounds: Phaser.Geom.Rectangle.Inflate(target.getBounds(), pad, pad),
    };
    this.entries.set(hotspot.id, entry);

    target.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-pad, -pad, target.width + pad * 2, target.height + pad * 2),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    const { Events } = Phaser.Input;
    target.on(Events.GAMEOBJECT_POINTER_OVER, () => this.setFocus(entry));
    target.on(Events.GAMEOBJECT_POINTER_DOWN, () => this.setFocus(entry));
    target.on(Events.GAMEOBJECT_POINTER_OUT, () => {
      if (this.focused === entry) this.setFocus(null);
    });
    target.on(Events.GAMEOBJECT_POINTER_UP, (pointer: Phaser.Input.Pointer) => this.tryActivate(entry, pointer));
  }

  /**
   * @param keepFocus leave the current highlight and label visible (e.g. during a scene fade-out)
   */
  setEnabled(enabled: boolean, { keepFocus = false } = {}): void {
    this.enabled = enabled;
    for (const { hotspot } of this.entries.values()) {
      if (enabled) hotspot.target.setInteractive();
      else hotspot.target.disableInteractive();
    }
    if (!enabled && !keepFocus) this.setFocus(null);
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onScenePointerDown, this);
    this.setFocus(null);
    this.entries.clear();
  }

  private tryActivate(entry: Entry, pointer: Phaser.Input.Pointer): void {
    if (!this.enabled) return;
    const pressStart = this.scene.cameras.main.getWorldPoint(pointer.downX, pointer.downY);
    if (!entry.hitBounds.contains(pressStart.x, pressStart.y)) return;

    this.setFocus(entry);
    entry.hotspot.onActivate();
  }

  /** A tap on empty space dismisses the current highlight (touch has no "pointer out"). */
  private onScenePointerDown(_pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (this.enabled && over.length === 0) this.setFocus(null);
  }

  private setFocus(entry: Entry | null): void {
    if (entry === this.focused) return;
    if (entry && !this.enabled) return;

    this.clearHighlight?.();
    this.clearHighlight = null;
    this.focused = entry;

    if (!entry) {
      this.labelView.hide();
      return;
    }

    const { target, label } = entry.hotspot;
    this.clearHighlight = applyHighlight(target);
    const bounds = target.getBounds();
    this.labelView.show(label, { x: bounds.centerX, top: bounds.top, bottom: bounds.bottom });
  }
}
