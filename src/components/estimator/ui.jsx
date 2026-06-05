// Iconos: imports ESTÁTICOS de lucide-react (sin DynamicIcon, que en dev fuerza
// re-optimización continua de Vite y en build arrastra cientos de chunks).
import {
  Sofa, CookingPot, Bath, BedDouble, Utensils, MoveHorizontal, DoorOpen, Monitor,
  Shirt, WashingMachine, Trees, Waves, Zap, Hammer, ThermometerSun, Droplets,
  DoorClosed, Paintbrush, Armchair, Sun, Video, Plug, PlugZap, Shield, Box, Search,
  ChevronDown, ChevronRight, Trash2, Plus, Scaling, MessageCircle, Eye, LogOut,
  House, RotateCw, WandSparkles, Eraser, LayoutGrid, PlusCircle, Square,
} from 'lucide-react';

const ICONS = {
  sofa: Sofa, 'cooking-pot': CookingPot, bath: Bath, 'bed-double': BedDouble,
  utensils: Utensils, 'move-horizontal': MoveHorizontal, 'door-open': DoorOpen,
  monitor: Monitor, shirt: Shirt, 'washing-machine': WashingMachine, trees: Trees,
  waves: Waves, zap: Zap, hammer: Hammer, 'thermometer-sun': ThermometerSun,
  droplets: Droplets, 'door-closed': DoorClosed, paintbrush: Paintbrush,
  armchair: Armchair, sun: Sun, video: Video, 'house-plug': Plug, 'plug-zap': PlugZap,
  shield: Shield, box: Box, cube: Box, search: Search, 'chevron-down': ChevronDown,
  'chevron-right': ChevronRight, 'trash-2': Trash2, plus: Plus, scaling: Scaling,
  'message-circle': MessageCircle, eye: Eye, 'log-out': LogOut, house: House,
  'rotate-cw': RotateCw, 'wand-sparkles': WandSparkles, eraser: Eraser,
  'layout-grid': LayoutGrid, 'plus-circle': PlusCircle,
};

// Icono lucide a partir de una clave 'lucide:nombre' (o 'nombre').
export function Icon({ name, size = 16, className, style }) {
  const n = (name || '').replace(/^lucide:/, '');
  const Cmp = ICONS[n] || Square;
  return <Cmp size={size} className={className} style={style} />;
}

// Interruptor (toggle) compacto. Usa el color de marca del tema.
export function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${on ? 'bg-primary' : 'bg-gray-300'}`}
      aria-pressed={on}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: on ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

// Chip seleccionable (opción de servicio / categoría).
export function Chip({ active, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors disabled:opacity-40 ${
        active
          ? 'bg-primary text-white border-primary'
          : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
      }`}
    >
      {children}
    </button>
  );
}

// Selector de color con presets + color libre.
export function ColorRow({ value, presets, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {presets.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-5 h-5 rounded-full border-2"
          style={{ background: c, borderColor: value === c ? 'var(--color-primary)' : 'transparent', boxShadow: '0 0 0 1px #d1d5db' }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded cursor-pointer bg-transparent border border-gray-300"
      />
    </div>
  );
}
