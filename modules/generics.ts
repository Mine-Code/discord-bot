import {
  Client,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import { Env } from "../main";

export abstract class BotModule {
  /** Bot client */
  client: Client;
  /** env(validated) */
  env: Env;
  /** BotModuleの名前 */
  abstract name: string;
  /** BotModuleの説明 */
  abstract description: string;
  /** BotModuleのバージョン */
  abstract version: string;
  /** BotModuleの作者 */
  abstract author: string;

  protected constructor(client: Client, env: Env) {
    this.client = client;
    this.env = env;
  }

  info() {
    return `
Name: ${this.name}
Description: ${this.description}
Version: ${this.version}
Author: ${this.author}
`.trim();
  }

  protected abstract command(): RESTPostAPIChatInputApplicationCommandsJSONBody[];
}
