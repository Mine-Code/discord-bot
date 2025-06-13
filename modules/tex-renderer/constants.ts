export const BASE_COMMAND = "tex";

export const SUB_COMMAND_RENDER_OPTION_MESSAGE = "text";
export const SUB_COMMAND_RENDER_OPTIONS = {
  [SUB_COMMAND_RENDER_OPTION_MESSAGE]: "描画するTeX形式の文字列",
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
