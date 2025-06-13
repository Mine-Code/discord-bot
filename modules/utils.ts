import { Channel, TextBasedChannel, TextChannel, NewsChannel, ThreadChannel } from "discord.js";

const CHANNEL_NOT_FOUND_MESSAGE = "Channel not found";
const CHANNEL_NOT_TEXT_BASED_MESSAGE = "Channel is not text channel";

// sendメソッドとsendTypingメソッドを持つギルドテキストチャンネルかチェック
export const isGuildTextChannel = (
  channel?: Channel | null,
): channel is TextChannel | NewsChannel => {
  // そもそもチャンネルが見つからない場合
  if (!channel) {
    console.error(CHANNEL_NOT_FOUND_MESSAGE);
    return false;
  }
  // TextChannelとNewsChannelはsendとsendTyping両方を持つ
  return channel instanceof TextChannel || channel instanceof NewsChannel;
};
