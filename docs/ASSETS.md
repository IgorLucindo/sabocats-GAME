# SaboCats — Art Direction & Asset Specifications

## 1. Visual Identity
- **Style:** Chunky 2D pixel art rendered at a 4x pixel scale.
- **Tone:** Goofy, cartoonish, underworld satire.
- **Palette:** Vibrant, saturated hues. Avoid muddy tones and muted pastels. Reference: *Nobody Saves the World*.
- **Camera Perspective:** Strict flat orthographic side-view platformer (0-point perspective, zero vanishing point, zero rotation).

---

## 2. Environment & Level Geometry

### 2.1 The Alleyway Lobby
- Designed as a continuous left-to-right progression: opens to a main city street on the far left, moves into an enclosed alleyway, and terminates into a solid brick dead-end wall on the far right.
- Scale is tailored to small feline protagonists; trash cans, window sills, and steps must match tiny cat measurements.
- The alley features an interactive clothing boutique where cats hide inside clothing racks to change cosmetic accessories, angering the store owner.
- The solid right wall includes a high-difficulty wall-jump climb reward/easter egg at the top.

### 2.2 UI & Menus
- **Main Menu:** Themed to the game's art style using persona-like dynamic animations, avoiding static boring menus.
- **Touch Gamepad:** Renders virtual buttons over the canvas. Includes a "custom" sub-menu allowing players to drag and drop button areas to save personalized layout offsets.
- **Typography:** Chunky pixel fonts across all overlays.

---

## 3. Animation & VFX Pipeline

### 3.1 Character Animations
- Bouncy, snappy sprite states with personality: tail flicks, idle blinks, angry meows.
- Transition states: ground landing impact, airborne mid-air turns, and wall-slide into airborne flips.
- Celebration animations: Character-specific win poses (e.g., licking paw, grooming).

### 3.2 Splatter & Death VFX
- **Saw Elimination:** Splits character sprite into two halves; the bottom half falls using standard physics while the top half acts as a dummy sprite/particle emitting blood bits.
- **Spike Elimination:** Freezes player gravity and velocity instantly to pin the cat cleanly to the hazard.
- **Soul Float:** Ghost/soul particle ascending vertically on specific non-dismemberment deaths.
- **Blood Staining:** Blood decals that dynamically map onto and stain nearby placed objects upon a player's death.
- **Explosions:** Specific, massive particle bursts for failed explosive interactions.

### 3.3 Screen Transitions
- **Goofy Black Bars:** A custom transition where black bars aggressively close in a comical style, accompanied by a closing hit sound.
- **Forced Movement Cinematic:** Black bars lock the screen while a cinematic animation plays (e.g., cats leaving spawn cages) before returning control.

---

## 4. Audio Direction
- **Networked Sounds:** Audio is synchronized via the `ON_SOUND` network event.
- **Character Audio:** Distinct angry meow sound triggers when cats are frustrated or caged.
- **Mechanical FX:** Object crate opening sounds.
- **Transitions:** Goofy closing hit sounds during black bar screen wipes.
- **Ambience:** Gritty background city alley noise.