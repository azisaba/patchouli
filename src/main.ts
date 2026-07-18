import { Configuration, PatchNotesApi, PatchNoteTarget, PlayersApi } from "@azisaba/graph";
import { Client, Events, GatewayIntentBits, WebhookClient } from "discord.js";

import { buildPatchNoteCommand, receivePatchNoteCommand } from "./commands/patch-note";
import { receivePatchNotePublishModalSubmit } from "./commands/patch-note-publish";
import { loadConfig } from "./config";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const webhookClients = {
  [PatchNoteTarget.CreativePro]: createWebhookClient(process.env.CREATIVE_PRO_WEBHOOK_URL),
  [PatchNoteTarget.Frontier]: createWebhookClient(process.env.FRONTIER_WEBHOOK_URL),
  [PatchNoteTarget.Life]: createWebhookClient(process.env.LIFE_WEBHOOK_URL),
  [PatchNoteTarget.LeonGunWar2]: createWebhookClient(process.env.LGW2_WEBHOOK_URL),
  [PatchNoteTarget.Sclat]: createWebhookClient(process.env.SCLAT_WEBHOOK_URL),
} satisfies Partial<Record<PatchNoteTarget, WebhookClient>>;

async function main() {
  console.log("Starting...");

  const discordBotToken = process.env.DISCORD_BOT_TOKEN;
  if (!discordBotToken) {
    throw new Error("`DISCORD_BOT_TOKEN` must be set");
  }

  const graphApiKey = process.env.GRAPH_API_KEY;
  if (!graphApiKey) {
    throw new Error("`GRAPH_API_KEY` must be set");
  }

  const patchNotesApi = new PatchNotesApi(
    new Configuration({
      accessToken: graphApiKey,
    }),
  );

  const playersApi = new PlayersApi(
    new Configuration({
      accessToken: graphApiKey,
    }),
  );

  const config = await loadConfig().catch((error) => {
    console.error("Failed to load config");
    throw error;
  });

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
          await receivePatchNotePublishModalSubmit({
            interaction,
            patchNotesApi,
            playersApi,
            webhookClients,
            config,
          });
          break;
      }
    }
  });

  await client.login(discordBotToken);
}

async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down...`);
  try {
    await client.destroy();

    for (const webhookClient of Object.values(webhookClients)) {
      webhookClient?.destroy();
    }

    console.log("Client destroyed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

function createWebhookClient(url?: string): WebhookClient | undefined {
  return url ? new WebhookClient({ url }) : undefined;
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch((error) => {
  console.error("Error during startup:", error);
  process.exit(1);
});
