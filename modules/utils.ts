import { Channel, TextBasedChannel } from "discord.js";

const CHANNEL_NOT_FOUND_MESSAGE = "Channel not found";
const CHANNEL_NOT_TEXT_BASED_MESSAGE = "Channel is not text channel";

export const isChannelTextBased = (
  channel?: Channel
): channel is TextBasedChannel => {
  // そもそもチャンネルが見つからない場合
  if (!channel) {
    console.error(CHANNEL_NOT_FOUND_MESSAGE);
    return false;
  }
  // チャンネルがテキストチャンネルでない場合
  if (!channel.isTextBased()) {
    console.error(CHANNEL_NOT_TEXT_BASED_MESSAGE);
    return false;
  }

  return true;
};
