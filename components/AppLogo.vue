<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 96 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cambodia Road Network Map">
    <defs>
      <linearGradient id="logo-background" x1="54" y1="30" x2="458" y2="482" gradientUnits="userSpaceOnUse">
        <stop stop-color="#03150C" />
        <stop offset="0.5" stop-color="#0B5D34" />
        <stop offset="1" stop-color="#1F7A3D" />
      </linearGradient>
      <radialGradient id="logo-glow" cx="0" cy="0" r="1" gradientTransform="translate(424 70) rotate(132) scale(282)" gradientUnits="userSpaceOnUse">
        <stop stop-color="#34D399" stop-opacity="0.55" />
        <stop offset="1" stop-color="#34D399" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="logo-glass" x1="112" y1="76" x2="404" y2="442" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FFFFFF" stop-opacity="0.34" />
        <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.13" />
      </linearGradient>
      <linearGradient id="logo-accent" x1="154" y1="386" x2="350" y2="386" gradientUnits="userSpaceOnUse">
        <stop stop-color="#34D399" />
        <stop offset="1" stop-color="#A7F3D0" />
      </linearGradient>
      <filter id="logo-shadow" x="66" y="42" width="386" height="442" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="18" stdDeviation="17" flood-color="#01120A" flood-opacity="0.38" />
      </filter>
      <path id="logo-shape-path" d="M256 0 L297.56 0.37 L321.87 1.46 L342.11 3.29 L359.97 5.85 L376.13 9.14 L390.94 13.16 L404.61 17.92 L417.27 23.41 L429.01 29.64 L439.88 36.61 L449.93 44.33 L459.19 52.81 L467.67 62.07 L475.39 72.12 L482.36 82.99 L488.59 94.73 L494.08 107.39 L498.84 121.06 L502.86 135.87 L506.15 152.03 L508.71 169.89 L510.54 190.13 L511.63 214.44 L512 256 L511.63 297.56 L510.54 321.87 L508.71 342.11 L506.15 359.97 L502.86 376.13 L498.84 390.94 L494.08 404.61 L488.59 417.27 L482.36 429.01 L475.39 439.88 L467.67 449.93 L459.19 459.19 L449.93 467.67 L439.88 475.39 L429.01 482.36 L417.27 488.59 L404.61 494.08 L390.94 498.84 L376.13 502.86 L359.97 506.15 L342.11 508.71 L321.87 510.54 L297.56 511.63 L256 512 L214.44 511.63 L190.13 510.54 L169.89 508.71 L152.03 506.15 L135.87 502.86 L121.06 498.84 L107.39 494.08 L94.73 488.59 L82.99 482.36 L72.12 475.39 L62.07 467.67 L52.81 459.19 L44.33 449.93 L36.61 439.88 L29.64 429.01 L23.41 417.27 L17.92 404.61 L13.16 390.94 L9.14 376.13 L5.85 359.97 L3.29 342.11 L1.46 321.87 L0.37 297.56 L0 256 L0.37 214.44 L1.46 190.13 L3.29 169.89 L5.85 152.03 L9.14 135.87 L13.16 121.06 L17.92 107.39 L23.41 94.73 L29.64 82.99 L36.61 72.12 L44.33 62.07 L52.81 52.81 L62.07 44.33 L72.12 36.61 L82.99 29.64 L94.73 23.41 L107.39 17.92 L121.06 13.16 L135.87 9.14 L152.03 5.85 L169.89 3.29 L190.13 1.46 L214.44 0.37 L256 0 Z" />
      <clipPath id="logo-shape"><use href="#logo-shape-path" /></clipPath>
    </defs>

    <use href="#logo-shape-path" fill="url(#logo-background)" />
    <g clip-path="url(#logo-shape)">
      <rect width="512" height="512" fill="url(#logo-glow)" class="logo-pulse" />
      <circle cx="20" cy="500" r="178" fill="#065F46" opacity="0.18" />
      <path d="M-44 92C122 14 326 20 552 184V-24H-44Z" fill="#FFFFFF" opacity="0.05" />
      <path d="M438 -12L540 90L210 420L108 318L438 -12Z" fill="#FFFFFF" opacity="0.035" />
    </g>

    <path
      d="M34 218C52 202 74 202 92 216C110 230 132 230 150 214"
      fill="none" stroke="#A7F3D0" stroke-opacity="0.75" stroke-width="11"
      stroke-linecap="round" stroke-dasharray="2 16" class="logo-route"
    />

    <g filter="url(#logo-shadow)">
      <path d="M142 72H324L408 156V398C408 420 390 438 368 438H142C120 438 102 420 102 398V112C102 90 120 72 142 72Z" fill="url(#logo-glass)" stroke="#FFFFFF" stroke-opacity="0.52" stroke-width="4" />
      <path d="M324 72V126C324 143 337 156 354 156H408L324 72Z" fill="#FFFFFF" fill-opacity="0.3" stroke="#FFFFFF" stroke-opacity="0.34" stroke-width="3" stroke-linejoin="round" />
    </g>

    <!-- Khmer letter ផ (Noto Sans Khmer Bold), baked to an outline so it
         renders identically everywhere and never depends on a Khmer font
         being installed on the viewer's system. -->
    <path
      fill-rule="evenodd"
      fill="#FFFFFF"
      fill-opacity="0.97"
      d="M328.31 246.09 L328.31 292.53 L328.31 345.99 L292.13 345.99 L261.62 326.01 L231.10 345.99 L194.92 345.99 L194.92 242.31 Q189.25 234.75 185.47 228.94 Q181.69 223.14 181.69 219.36 L181.69 219.36 Q181.69 216.66 182.78 214.37 Q183.85 212.07 186.28 208.83 Q188.72 205.59 193.03 200.73 Q197.35 195.87 203.83 187.77 L203.83 187.77 L282.13 187.77 Q285.64 187.77 287.26 186.15 Q288.88 184.53 288.88 181.02 L288.88 181.02 L288.88 164.01 L328.31 164.01 L328.31 189.93 Q328.31 200.73 322.37 206.94 Q316.43 213.15 304.27 213.15 L304.27 213.15 L212.75 213.15 Q211.66 214.23 210.99 215.04 Q210.31 215.85 209.91 216.66 Q209.50 217.47 209.50 218.28 L209.50 218.28 Q209.50 220.17 213.42 224.09 Q217.33 228.00 223.00 232.86 Q228.68 237.72 234.34 242.31 L234.34 242.31 L234.34 310.35 L261.62 291.72 L288.62 310.08 L288.62 285.51 Q279.44 285.51 272.69 282.27 Q265.94 279.03 262.15 273.09 Q258.38 267.15 258.38 259.32 L258.38 259.32 Q258.38 245.01 269.31 236.64 Q280.25 228.27 300.23 228.27 L300.23 228.27 Q312.91 228.27 320.61 233.13 Q328.31 237.99 328.31 246.09 L328.31 246.09 M288.62 265.80 L288.62 265.80 L288.62 249.87 Q286.19 249.87 284.16 250.81 Q282.13 251.76 281.06 253.51 Q279.98 255.27 279.98 257.97 L279.98 257.97 Q279.98 262.02 282.40 263.91 Q284.84 265.80 288.62 265.80"
    />

    <path d="M154 386H346" stroke="url(#logo-accent)" stroke-width="12" stroke-linecap="round" class="logo-underline" />

    <path d="M409 43C412 57 419 64 433 67C419 70 412 77 409 91C406 77 399 70 385 67C399 64 406 57 409 43Z" fill="#FFFFFF" class="logo-sparkle" />
    <circle cx="440" cy="99" r="6" fill="#A7F3D0" class="logo-dot" />
  </svg>
</template>

<style scoped>
.logo-pulse {
  animation: logo-glow-pulse 4s ease-in-out infinite;
}
.logo-route {
  animation: logo-route-flow 1.4s linear infinite;
}
.logo-underline {
  animation: logo-underline-pulse 2.4s ease-in-out infinite;
  transform-origin: 250px 386px;
}
.logo-sparkle {
  animation: logo-sparkle-twinkle 2.2s ease-in-out infinite;
}
.logo-dot {
  animation: logo-dot-twinkle 1.8s ease-in-out infinite;
}

@keyframes logo-glow-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
@keyframes logo-route-flow {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -36; }
}
@keyframes logo-underline-pulse {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.35); }
}
@keyframes logo-sparkle-twinkle {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
@keyframes logo-dot-twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@media (prefers-reduced-motion: reduce) {
  .logo-pulse, .logo-route, .logo-underline, .logo-sparkle, .logo-dot {
    animation: none;
  }
}
</style>
