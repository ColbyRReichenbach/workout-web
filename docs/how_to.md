# 🩺 Pulse Visual Design System: "Editorial Spectrum"

This guide documents the UI/UX principles and code snippets used to build the high-end, editorial aesthetic of the **Pulse** training terminal.

## 1. The Core Philosophy
- **Tonal Depth**: Move away from cold dark modes. Use organic, tan-based backgrounds (`#f5f2ed`) paired with rich stone-toned typography.
- **Micro-Interactions**: Use subtle scale (`1.01x`) and vertical lift (`y: -4`) instead of aggressive 3D rotations. stability = premium.
- **Biometric Accent**: Use a single, high-frequency "Pulse Red" (`#ef4444`) as the primary accent, signifying the heartbeat of the protocol.
- **Glassmorphism 2.0**: Instead of dark glass, use "Frosted Bone" glass (`bg-white/70`, `backdrop-blur-xl`) which feels lighter and more surgical.

---

## 2. Global Branding: The Pulse Border
The signature visual of Pulse is the **Border Beam**—a thin line of light that orbits the application frame.

```css
/* Implementation in globals.css */
.pulse-border-beam::after {
    content: "";
    position: absolute;
    inset: -2px;
    padding: 2px;
    border-radius: inherit;
    background: conic-gradient(
      from 0deg at 50% 50%,
      transparent 0%,
      transparent 70%,
      var(--primary) 85%,
      transparent 100%
    );
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    animation: pulse-spin 4s linear infinite;
}
```

---

## 3. The New Navigation: Header-First
Pulse ditches the permanent sidebar for a **Glass Navbar** that stays out of the way.

```tsx
<header className="fixed top-0 left-0 right-0 z-[100] px-8 py-6">
    <div className="max-w-7xl mx-auto rounded-3xl bg-white/40 backdrop-blur-md border border-transparent flex items-center justify-between px-6 py-3">
        {/* Brand & Nav items */}
    </div>
</header>
```

---

## 4. Typography Hierarchy
- **Primary Display**: `Playfair Display` (Italic) for headings. It conveys a "Elite Performance" editorial vibe.
- **UI Labeling**: `Inter` (Bold, Uppercase, Spaced) for labels. `tracking-[0.3em]`.
- **Data Mono**: `JetBrains Mono` or similar for metric values to emphasize surgical accuracy.

---

## 5. Layout: The Editorial Bento
Always group metrics into blocks that tell a story.
- Use **TiltCard** (Lighter variant) for all interactive containers.
- Use **Gaps of 8-10** for balanced negative space.
- Add **Subtle Texture**: A grainy noise overlay (`opacity-[0.03]`) adds a physical, "paper" feel to the digital UI.

---

## 6. Color Spectrum (Pulse-V2)
| Element | HEX | Tailwind |
| :--- | :--- | :--- |
| Background | `#f5f2ed` | `bg-background` |
| Primary Accent | `#ef4444` | `text-primary` |
| Text (Primary) | `#1c1917` | `text-stone-900` |
| Text (Muted) | `#a8a29e` | `text-stone-400` |
| Border | `rgba(0,0,0,0.03)` | `border-black/[0.03]` |

---

## 7. Micro-Animation Checklist
- [x] **Card Lift**: `whileHover={{ y: -4, scale: 1.01 }}`
- [x] **Smooth Transitions**: `transition-all duration-300 ease-out`
- [x] **Viewport Border**: Orbiting pulse at `opacity-40`.
- [x] **Empty States**: AI Coach "Standby" pulse animation.
