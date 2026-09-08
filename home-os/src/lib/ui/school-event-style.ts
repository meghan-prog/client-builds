const TYPE_LABEL_NL: Record<string, string> = {
  school_day: "Schooldag",
  study_day: "Studiedag",
  holiday: "Vakantie",
  school_trip: "Schoolreis",
  parent_evening: "Ouderavond",
  free_day: "Vrije dag",
  school_activity: "Schoolactiviteit",
};

const TYPE_ICON: Record<string, string> = {
  school_day: "🏫",
  study_day: "🏠",
  holiday: "🏖️",
  school_trip: "🚌",
  parent_evening: "🗣️",
  free_day: "🌤️",
  school_activity: "🎭",
};

export function schoolEventTypeLabel(type: string): string {
  return TYPE_LABEL_NL[type] ?? type;
}

export function schoolEventTypeIcon(type: string): string {
  return TYPE_ICON[type] ?? "📌";
}
