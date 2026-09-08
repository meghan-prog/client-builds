import type { BlockCategory } from "@/lib/planning-engine";

interface CategoryStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export const CATEGORY_STYLES: Record<BlockCategory, CategoryStyle> = {
  school: {
    label: "School",
    bg: "bg-[#EAF0F6]",
    text: "text-[#3C5A75]",
    border: "border-[#CBDCE9]",
    dot: "bg-[#5B84A6]",
  },
  work: {
    label: "Werk",
    bg: "bg-[#EEEBF4]",
    text: "text-[#584C79]",
    border: "border-[#D9D2E9]",
    dot: "bg-[#7B6BA3]",
  },
  routine: {
    label: "Routine",
    bg: "bg-[#F3EEE7]",
    text: "text-[#746457]",
    border: "border-[#E7DCCF]",
    dot: "bg-[#B3A088]",
  },
  household: {
    label: "Huishouden",
    bg: "bg-[#FBF1DE]",
    text: "text-[#8A6A25]",
    border: "border-[#F0DDAF]",
    dot: "bg-[#D9A441]",
  },
  learning: {
    label: "Leren",
    bg: "bg-[#FBE9E1]",
    text: "text-[#A5502F]",
    border: "border-[#F1CBB6]",
    dot: "bg-[#C97B5B]",
  },
  activity: {
    label: "Activiteit",
    bg: "bg-[#E9F1EB]",
    text: "text-[#3F6E4D]",
    border: "border-[#CBE1D0]",
    dot: "bg-[#6EA37D]",
  },
  free: {
    label: "Vrije ruimte",
    bg: "bg-[#F6F8F4]",
    text: "text-[#5E7A64]",
    border: "border-dashed border-[#CBDFCF]",
    dot: "bg-[#9DBBA3]",
  },
  appointment: {
    label: "Afspraak",
    bg: "bg-[#FBE7E5]",
    text: "text-[#A1443A]",
    border: "border-[#F0C7C1]",
    dot: "bg-[#C1523F]",
  },
};

export function categoryStyle(category: BlockCategory): CategoryStyle {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES.routine;
}
