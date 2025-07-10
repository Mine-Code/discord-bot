import { Client, REST, Routes, Partials } from "discord.js";
import * as v from "valibot";
import * as modules from "./modules";
import { config } from "dotenv";

const envSchema = v.object({
  BOT_TOKEN: v.string(),
  BOT_ID: v.string(),
  GUILD_ID: v.string(),
  OBSERVER_CHANNEL_ID: v.string(),
});

config();

export type Env = v.InferInput<typeof envSchema>;

const env = v.parse(envSchema, process.env);
process.env.TZ = "Asia/Tokyo";

const client = new Client({
  intents: [
    "Guilds",
    "GuildVoiceStates",
    "GuildMessages",
    "GuildMembers",
    "MessageContent",
    "GuildMessageReactions",
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
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
