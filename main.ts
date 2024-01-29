import { Client, REST, Routes } from "discord.js";
import { z } from "zod";
import * as modules from "./modules";
import { config } from "dotenv";

const envSchema = z.object({
  BOT_TOKEN: z.string(),
  BOT_ID: z.string(),
  GUILD_ID: z.string(),
  OBSERVER_CHANNEL_ID: z.string(),
});

config();

export type Env = z.infer<typeof envSchema>;

const env = envSchema.parse(process.env);
process.env.TZ = "Asia/Tokyo";

const client = new Client({
  intents: [
    "Guilds",
    "GuildVoiceStates",
    "GuildMessages",
    "GuildMembers",
    "MessageContent",
  ],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

const commandsJsons = Object.values(modules).flatMap((Module) => {
  const module = new Module(client, env);
  module.init();
  return module.command();
});

const rest = new REST({ version: "10" }).setToken(env.BOT_TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(env.BOT_ID), {
      body: commandsJsons,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

client.login(env.BOT_TOKEN);
