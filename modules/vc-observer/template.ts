import { EmbedBuilder, VoiceBasedChannel, channelLink } from "discord.js";
import { USER_IMAGE_NOT_FOUND_URL } from "./constants";

export const NOTIFICATION_TEMPLATE = (
  type: "join" | "leave" | "move",
  username: string | undefined = "unknown",
  channel: VoiceBasedChannel,
  memberCount: number,
  avatarURL?: string | null
) => {
  let title: string;
  let description: string;
  let color: number;
  switch (type) {
    case "join":
      title = "VCに入室しました";
      description = `→ <#${channel.id}>`;
      color = 0x08ef74;
      break;
    case "leave":
      title = "VCから退出しました";
      description = `← <#${channel.id}>`;
      color = 0xf10404;
      break;
    case "move":
      title = "VCを移動しました";
      description = `→ <#${channel.id}>`;
      color = 0xf1f104;
      break;
  }
  return new EmbedBuilder({
    title,
    description,
    fields: [
      {
        name: "現在の参加人数",
        value: `${memberCount}`,
        inline: true,
      },
    ],
    color,
    timestamp: new Date().toLocaleString(), // 多分要らない
    author: {
      name: username,
      icon_url: avatarURL ?? USER_IMAGE_NOT_FOUND_URL,
    }
  });
};
