import { PatchNotesApi } from "@azisaba/graph";
import {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
} from "discord.js";

import {
  buildPatchNotePublishSubcommand,
  receivePatchNotePublishSubcommand,
} from "./patch-note-publish";
import {
  buildPatchNoteUnpublishSubcommand,
  receivePatchNoteUnpublishSubcommand,
} from "./patch-note-unpublish";

export function buildPatchNoteCommand(): RESTPostAPIChatInputApplicationCommandsJSONBody {
  return new SlashCommandBuilder()
    .setName("patch-note")
    .setDescription("The Patchouli command-line tool")
    .addSubcommand(buildPatchNotePublishSubcommand)
    .addSubcommand(buildPatchNoteUnpublishSubcommand)
    .toJSON();
}

export async function receivePatchNoteCommand(
  interaction: ChatInputCommandInteraction,
  api: PatchNotesApi,
) {
  switch (interaction.options.getSubcommand()) {
    case "publish":
      await receivePatchNotePublishSubcommand(interaction);
      break;
    case "unpublish":
      await receivePatchNoteUnpublishSubcommand(interaction, api);
      break;
  }
}
