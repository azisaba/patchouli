import { Configuration, PatchNotesApi, PlayersApi } from "@azisaba/graph";
import { Client, Events, GatewayIntentBits } from "discord.js";

import { buildPatchNoteCommand, receivePatchNoteCommand } from "./commands/patch-note";
import { receivePatchNotePublishModalSubmit } from "./commands/patch-note-publish";
import { loadConfig } from "./config";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

async function main() {
  if (1 === 1) {
    const api = new PlayersApi(
      new Configuration({
        accessToken: process.env.GRAPH_API_KEY,
      }),
    );

    const response = await api.getPlayerById({
      playerId: "00e51a4d-d30d-4d88-9c75-0a7409ba75b3",
    });

    console.log(response);
    return;
  }

  console.log("Starting...");

  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("`BOT_TOKEN` must be set");
  }

  const graphApiKey = process.env.GRAPH_API_KEY;
  if (!graphApiKey) {
    throw new Error("`GRAPH_API_KEY` must be set");
  }

  const config = await loadConfig().catch((error) => {
    console.error("Failed to load config");
    throw error;
  });

  const patchNotesApi = new PatchNotesApi(
    new Configuration({
      basePath: config.basePath,
      accessToken: graphApiKey,
    }),
  );

  const playersApi = new PlayersApi(
    new Configuration({
      basePath: config.basePath,
      accessToken: graphApiKey,
    }),
  );

  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);

    const commands = [buildPatchNoteCommand()];
    await readyClient.application.commands.set(commands);
    console.log(`Registered ${commands.length} commands`);

    console.log("Client is ready");
  });

  client.on(Events.Error, async (error) => {
    console.error("Discord client error:", error);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
        case "patch-note":
          await receivePatchNoteCommand(interaction, patchNotesApi);
          break;
      }
    } else if (interaction.isModalSubmit()) {
      switch (interaction.customId) {
        case "patchouli:publish":
          await receivePatchNotePublishModalSubmit(interaction, patchNotesApi, playersApi, config);
          break;
      }
    }
  });

  await client.login(token);
}

async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down...`);
  try {
    await client.destroy();
    console.log("Client destroyed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch((error) => {
  console.error("Error during startup:", error);
  process.exit(1);
});
