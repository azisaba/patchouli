import { PatchNotesApi } from "@azisaba/graph";
import { ChatInputCommandInteraction, Locale, SlashCommandSubcommandBuilder } from "discord.js";

import { i18n } from "../utils/i18n";

export function buildPatchNoteUnpublishSubcommand(
  builder: SlashCommandSubcommandBuilder,
): SlashCommandSubcommandBuilder {
  return builder
    .setName("unpublish")
    .setDescription("Unpublish a patch note.")
    .setDescriptionLocalization(Locale.Japanese, "パッチノートを削除します。")
    .addStringOption((builder) =>
      builder
        .setName("id")
        .setDescription("Identifier of the patch note.")
        .setDescriptionLocalization(Locale.Japanese, "パッチノートのID。")
        .setRequired(true),
    );
}

export async function receivePatchNoteUnpublishSubcommand(
  interaction: ChatInputCommandInteraction,
  api: PatchNotesApi,
) {
  const id = interaction.options.getString("id", true);

  await interaction.deferReply();

  try {
    await api.deletePatchNoteById({ patchNoteId: id });

    await interaction.editReply({
      content: i18n(interaction.guildLocale, {
        [Locale.EnglishUS]: "✅ Unpublished the patch note.",
        [Locale.Japanese]: "✅ パッチノートを削除しました。",
      }),
    });
  } catch (error) {
    console.error("Failed to delete patch note:", error);
    await interaction.editReply({ content: "❌ API error" });
  }
}
