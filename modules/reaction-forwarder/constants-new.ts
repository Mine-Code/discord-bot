export const BASE_COMMAND = "reaction-forwarder";

export const SUB_COMMAND_HELP = "help";
export const SUB_COMMAND_INFO = "info";
export const SUB_COMMAND_ENABLE = "enable";
export const SUB_COMMAND_DISABLE = "disable";

export const SUB_COMMANDS = {
  [SUB_COMMAND_HELP]: "リアクション転送システムのヘルプを表示する",
  [SUB_COMMAND_INFO]: "リアクション転送システムの情報を表示する",
  [SUB_COMMAND_ENABLE]: "リアクション転送を有効にする",
  [SUB_COMMAND_DISABLE]: "リアクション転送を無効にする",
};

export interface ReactionForwarderConfig {
  enabled: boolean;
  forwardTo: string;
  threshold: number;
  reactions: string[];
}

// UI設定
export const EMBED_COLOR = 0x93a5a6; // #93a5a6
export const EMBED_FALLBACK_MESSAGE = "(コメント無し)";
export const EMBED_UNKNOWN_USER = "Unknown User";
