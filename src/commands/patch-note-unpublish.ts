import { PatchNotesApi } from "@azisaba/graph";
import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";

import { checkRole, Config } from "../config";

export function buildPatchNoteUnpublishSubcommand(
  builder: SlashCommandSubcommandBuilder,
): SlashCommandSubcommandBuilder {
  return builder
    .setName("unpublish")
    .setDescription("パッチノートを削除します")
    .addStringOption((builder) =>
      builder.setName("id").setDescription("削除するパッチノートのID").setRequired(true),
    );
}

export async function receivePatchNoteUnpublishSubcommand({
  interaction,
  patchNotesApi,
  config,
}: {
  interaction: ChatInputCommandInteraction;
  patchNotesApi: PatchNotesApi;
  config: Config;
}) {
  const patchNoteId = interaction.options.getString("id", true);

  await interaction.deferReply();

  try {
    const patchNote = await patchNotesApi.getPatchNoteById({ patchNoteId });

    if (
      !checkRole({
        config,
        guildMember: interaction.member,
        patchNoteTarget: patchNote.target,
      })
    ) {
      await interaction.editReply({
        content: "❌ このサーバーのパッチノートを削除する権限がありません",
      });
    }

    await interaction.editReply({
      content: `🔁 「${patchNote.title}」を削除しています...`,
    });

    await patchNotesApi.deletePatchNoteById({ patchNoteId });

    await interaction.editReply({
      content: `✨ 「${patchNote.title}」を削除しました。`,
    });
  } catch (error) {
    console.error("Failed to delete patch note:", error);
    await interaction.editReply({ content: "❌ API error" });
  }
}
