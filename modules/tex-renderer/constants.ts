export const BASE_COMMAND = "tex";

export const SUB_COMMAND_RENDER_OPTION_MESSAGE = "text";
export const SUB_COMMAND_RENDER_OPTION_SCALE = "scale";
export const SUB_COMMAND_RENDER_OPTIONS = {
  [SUB_COMMAND_RENDER_OPTION_MESSAGE]: "描画するTeX形式の文字列",
  [SUB_COMMAND_RENDER_OPTION_SCALE]: "画像のスケール (0.1〜5.0、デフォルト: 1.0)",
};

export const SUB_COMMAND_HELP = "help";
export const SUB_COMMAND_INFO = "info";
export const SUB_COMMAND_RENDER = "render";

export const SUB_COMMANDS = {
  [SUB_COMMAND_HELP]: "TeX 数式描画システムのヘルプを表示する",
  [SUB_COMMAND_INFO]: "TeX 数式描画システムの情報を表示する",
  [SUB_COMMAND_RENDER]: "数式を描画する",
};

export const WIDTH_ATTR_REGEX = /width="([^"]*)"/;
export const HEIGHT_ATTR_REGEX = /height="([^"]*)"/;

// スケール値の制約
export const SCALE_MIN = 0.1;
export const SCALE_MAX = 5.0;
export const SCALE_DEFAULT = 1.0;

export const RENDER_TIMEOUT_MS = 60000; // 1分でタイムアウト
