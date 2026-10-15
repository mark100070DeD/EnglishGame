import Phaser from 'phaser';
import { TextureKeys } from '../assets/keys';
import { HOTSPOT_HIT_PADDING, SCENE_FADE_MS, TILE_SIZE } from '../config/constants';
import { HotspotSystem } from '../systems/interaction/HotspotSystem';
import { getUiRoot } from '../ui/dom';
import { WorldLabel } from '../ui/WorldLabel';
import { addBackdrop } from '../world/backdrop';
import { buildRoom, type BuiltRoom } from '../world/RoomBuilder';
import type { DoorPlacement, RoomDefinition } from '../world/RoomDefinition';
import type { SceneTransition } from './sceneData';

/**
 * Shared behaviour of every room: map, static camera showing the whole room,
 * clickable doors with labels, and fade transitions.
 * Subclasses supply the room definition and add room-specific content in populate().
 */
export abstract class RoomScene<TData extends object = object> extends Phaser.Scene {
  protected hotspots!: HotspotSystem;
  protected room!: BuiltRoom;

  private label!: WorldLabel;
  private transitioning = false;

  protected abstract getRoomDefinition(data: TData): RoomDefinition;

  /** Hook for room-specific objects (NPCs, extra hotspots). */
  protected populate(_data: TData): void {}

  /** Hook for cleanup when the scene stops. Always call super. */
  protected onShutdown(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.hotspots.destroy();
    this.label.destroy();
  }

  create(data: TData): void {
    // Phaser reuses scene instances between starts, so per-run state is reset here.
    this.transitioning = false;

    const definition = this.getRoomDefinition(data);
    this.room = buildRoom(this, definition);
    this.setupCamera();

    this.label = new WorldLabel(getUiRoot(), (x, y) => this.worldToClient(x, y));
    this.hotspots = new HotspotSystem(this, this.label, HOTSPOT_HIT_PADDING);

    definition.doors.forEach((door) => this.addDoor(door));
    this.populate(data);

    // The scale manager is global: it must be unsubscribed on shutdown.
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.onShutdown());
    this.cameras.main.fadeIn(SCENE_FADE_MS);
  }

  /** Turns world interaction on/off, e.g. while a UI window is open. */
  protected setInteractionEnabled(enabled: boolean): void {
    this.hotspots.setEnabled(enabled);
  }

  protected travelTo(transition: SceneTransition): void {
    if (this.transitioning) return;
    this.transitioning = true;
    // Keep the clicked door highlighted while the screen fades out.
    this.hotspots.setEnabled(false, { keepFocus: true });

    this.cameras.main.fadeOut(SCENE_FADE_MS);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(transition.scene, transition.data);
    });
  }

  private addDoor(door: DoorPlacement): void {
    const image = this.add
      .image(door.x * TILE_SIZE, door.y * TILE_SIZE, TextureKeys.Door)
      .setOrigin(0, 0)
      .setDepth(1);

    this.hotspots.register({
      id: `door:${door.id}`,
      target: image,
      label: door.label,
      onActivate: () => this.travelTo(door.target),
    });
  }

  /**
   * Static camera centered on the room. Zoom stays 1 so every room shares the same pixel scale
   * and the space around the building is visible; only rooms larger than the viewport are scaled down.
   * The visible area outside the room is filled with the backdrop.
   */
  private setupCamera(): void {
    const camera = this.cameras.main;
    const { widthPx, heightPx } = this.room;
    const zoom = Math.min(1, camera.width / widthPx, camera.height / heightPx);
    const viewWidth = camera.width / zoom;
    const viewHeight = camera.height / zoom;

    camera.setZoom(zoom);
    camera.centerOn(widthPx / 2, heightPx / 2);

    const view = new Phaser.Geom.Rectangle(
      (widthPx - viewWidth) / 2,
      (heightPx - viewHeight) / 2,
      viewWidth,
      viewHeight,
    );
    addBackdrop(this, view, { width: widthPx, height: heightPx });
  }

  private onResize(): void {
    this.label.reposition();
  }

  private worldToClient(x: number, y: number): { x: number; y: number } {
    const camera = this.cameras.main;
    const canvasRect = this.game.canvas.getBoundingClientRect();
    const gameX = camera.x + (x - camera.worldView.x) * camera.zoom;
    const gameY = camera.y + (y - camera.worldView.y) * camera.zoom;
    return {
      x: canvasRect.left + (gameX * canvasRect.width) / this.scale.width,
      y: canvasRect.top + (gameY * canvasRect.height) / this.scale.height,
    };
  }
}
