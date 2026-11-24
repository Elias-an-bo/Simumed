import { Atom, Bone, Layers, Microscope, Package, PawPrint, Stethoscope, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  simuladores: Stethoscope,
  "modelos-anatomicos": Bone,
  microscopios: Microscope,
  "laminas-preparadas": Layers,
  "kits-moleculares": Atom,
  "anatomia-veterinaria": PawPrint,
};

export function categoryIcon(rootSlug: string): LucideIcon {
  return ICONS[rootSlug] ?? Package;
}
