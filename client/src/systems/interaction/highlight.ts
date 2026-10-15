import Phaser from 'phaser';

const GLOW_COLOR = 0xffe08a;

/**
 * Highlights an object and returns a function that removes the highlight.
 * WebGL: pulsing outer glow. Canvas renderer (no FX support): warm tint.
 */
export function applyHighlight(target: Phaser.GameObjects.Image): () => void {
  const fx = target.preFX;
  if (!fx) {
    target.setTint(GLOW_COLOR);
    return () => target.clearTint();
  }

  // Room around the sprite so the glow is not clipped by the texture bounds.
  fx.setPadding(6);
  const glow = fx.addGlow(GLOW_COLOR, 3, 0, false, 0.1, 8);
  const pulse = target.scene.tweens.add({
    targets: glow,
    outerStrength: 1.5,
    duration: 550,
    ease: Phaser.Math.Easing.Sine.InOut,
    yoyo: true,
    repeat: -1,
  });

  return () => {
    pulse.remove();
    fx.remove(glow);
  };
}
