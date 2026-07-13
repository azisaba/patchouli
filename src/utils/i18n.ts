import { PatchNoteCategory, PatchNoteTarget } from "@azisaba/graph";
import { Locale } from "discord.js";

export function i18n(
  locale: Locale | null,
  translations: Partial<Record<Locale, string>> & Record<Locale.EnglishUS, string>,
): string {
  const localeOrDefault = locale ?? Locale.EnglishUS;
  return translations[localeOrDefault] ?? translations[Locale.EnglishUS];
}

export function localizePatchNoteTarget(locale: Locale | null, value: PatchNoteTarget): string {
  switch (value) {
    case "creativePro":
      return "CreativePro";
    case "frontier":
      return "Frontier";
    case "life":
      return "LIFE";
    case "leonGunWar2":
      return "LeonGunWar2";
    case "sclat":
      return "Sclat";
  }
}

export function localizePatchNoteCategory(locale: Locale | null, value: PatchNoteCategory): string {
  switch (value) {
    case "balance":
      return i18n(locale, {
        [Locale.EnglishUS]: "🔧 Balance",
        [Locale.Japanese]: "🔧 バランス",
      });
    case "feature":
      return i18n(locale, {
        [Locale.EnglishUS]: "✨ Feature",
        [Locale.Japanese]: "✨ 新機能",
      });
    case "fix":
      return i18n(locale, {
        [Locale.EnglishUS]: "🐛 Fix",
        [Locale.Japanese]: "🐛 バグ修正",
      });
    case "improvement":
      return i18n(locale, {
        [Locale.EnglishUS]: "📈 Improvement",
        [Locale.Japanese]: "📈 改善",
      });
  }
}
