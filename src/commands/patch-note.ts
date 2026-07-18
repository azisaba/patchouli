import { PatchNotesApi } from "@azisaba/graph";
import {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
} from "discord.js";

import { Config } from "../config";
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
    .setDescription("パッチノートを管理できるよ")
    .addSubcommand(buildPatchNotePublishSubcommand)
    .addSubcommand(buildPatchNoteUnpublishSubcommand)
    .toJSON();
}

export async function receivePatchNoteCommand({
  interaction,
  patchNotesApi,
  config,
}: {
  interaction: ChatInputCommandInteraction;
  patchNotesApi: PatchNotesApi;
  config: Config;
}) {
  switch (interaction.options.getSubcommand()) {
    case "publish":
      await receivePatchNotePublishSubcommand(interaction);
      break;
    case "unpublish":
      await receivePatchNoteUnpublishSubcommand({ interaction, patchNotesApi, config });
      break;
  }
}
