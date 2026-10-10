// Punto único de registro de GSAP (ver .claude/skills/gsap-scrolltrigger/references/es/astro.md §2).
// Los <script> de Astro solo corren en el navegador; si se importa desde SSR, guardar con typeof window.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: 'power2.out', duration: 0.6 });

export { gsap, ScrollTrigger };
