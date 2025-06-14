import { AttachmentBuilder } from "discord.js";
// @ts-ignore
import * as mj from "mathjax-node";
import sharp from "sharp";
import { SCALE_MIN, SCALE_MAX, SCALE_DEFAULT } from "./constants";

interface RenderOptions {
  displayMode?: boolean;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  transparent?: boolean;
  scale?: number;
}

// MathJax-Node を初期化
mj.config({
  MathJax: {
    loader: {
      load: ["input/tex", "output/svg"],
    },
  },
});

export class MathJaxRenderer {
  private static readonly DEFAULT_OPTIONS: Required<RenderOptions> = {
    displayMode: true,
    fontSize: 24,
    color: "#000000",
    backgroundColor: "#ffffff",
    padding: 8,
    transparent: false,
    scale: SCALE_DEFAULT,
  };

  constructor() {
    // MathJax-Node は自動的に初期化される
  }

  /**
   * LaTeX数式をPNG画像としてレンダリング
   */
  async renderTeX(tex: string, options: RenderOptions = {}): Promise<AttachmentBuilder | null> {
    try {
      const opts = { ...MathJaxRenderer.DEFAULT_OPTIONS, ...options };

      const input = { math: tex, format: "TeX" as const, svg: true };
      const data = await new Promise<any>((resolve, reject) => {
        mj.typeset(input, (result: any) => {
          if (result.errors) {
            reject(new Error(result.errors.join(", ")));
          } else {
            resolve(result);
          }
        });
      });

      if (!data.svg) {
        return null;
      }

      if (data.errors) {
        throw new Error(data.errors);
      }

      let svg = data.svg;

      const WIDTH_ATTR_REGEX = /width="([^"]+)"/;
      const HEIGHT_ATTR_REGEX = /height="([^"]+)"/;

      const widthMatch = svg.match(WIDTH_ATTR_REGEX);
      const heightMatch = svg.match(HEIGHT_ATTR_REGEX);

      if (!widthMatch || !heightMatch) {
        return null;
      }

      const width = parseFloat(widthMatch[1]);
      const height = parseFloat(heightMatch[1]);

      // スケール値のバリデーション
      let scale = opts.scale;
      if (scale < SCALE_MIN) {
        scale = SCALE_MIN;
      } else if (scale > SCALE_MAX) {
        scale = SCALE_MAX;
      }

      const scaledWidth = width * scale;
      const scaledHeight = height * scale;

      svg = svg
        .replace(WIDTH_ATTR_REGEX, `width="${scaledWidth}ex"`)
        .replace(HEIGHT_ATTR_REGEX, `height="${scaledHeight}ex"`);

      if (!opts.transparent) {
        const rectElement = `<rect x="0" y="0" width="100%" height="100%" fill="${opts.backgroundColor}"/>`;

        if (svg.includes("<g ")) {
          svg = svg.replace("<g ", `${rectElement}<g `);
        } else {
          svg = svg.replace(/<svg([^>]*)>/, `<svg$1>${rectElement}`);
        }
      }

      if (svg.includes("xlink:href") && !svg.includes("xmlns:xlink")) {
        svg = svg.replace(/<svg([^>]*)>/, '<svg$1 xmlns:xlink="http://www.w3.org/1999/xlink">');
      }

      // スケールに応じて DPI を調整（scale 1.0 = 150 DPI）
      const baseDPI = 150;
      let adjustedDPI = Math.round(baseDPI * scale);

      // DPI の制限（品質と処理時間のバランス）
      const minDPI = 72; // 最小 DPI
      const maxDPI = 600; // 最大 DPI
      adjustedDPI = Math.max(minDPI, Math.min(maxDPI, adjustedDPI));

      const sharpInstance = sharp(Buffer.from(svg), {
        density: adjustedDPI,
      });

      if (!opts.transparent) {
        sharpInstance.flatten({ background: opts.backgroundColor });
      }

      let pngBuffer = await sharpInstance
        .png({
          quality: 100,
          compressionLevel: 0,
          palette: false,
          progressive: false,
          adaptiveFiltering: false,
          force: true,
        })
        .toBuffer();

      const marginPixels = 4;
      const { width: originalWidth, height: originalHeight } = await sharp(pngBuffer).metadata();

      if (originalWidth && originalHeight) {
        pngBuffer = await sharp({
          create: {
            width: originalWidth + marginPixels * 2,
            height: originalHeight + marginPixels * 2,
            channels: 4,
            background: opts.transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : opts.backgroundColor,
          },
        })
          .composite([
            {
              input: pngBuffer,
              left: marginPixels,
              top: marginPixels,
              blend: "over",
            },
          ])
          .png({
            quality: 100,
            compressionLevel: 0,
            palette: false,
            progressive: false,
            adaptiveFiltering: false,
            force: true,
          })
          .toBuffer();
      }

      return new AttachmentBuilder(pngBuffer, {
        name: "formula.png",
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ParseError")) {
          // LaTeX構文エラー
        } else if (error.message.includes("Sharp")) {
          // 画像処理エラー
        }
      }

      return null;
    }
  }

  /**
   * 数式の構文検証
   */
  validateTeX(tex: string): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const input = {
        math: tex,
        format: "TeX" as const,
        svg: true,
      };

      mj.typeset(input, (result: any) => {
        if (result.errors && result.errors.length > 0) {
          resolve({
            valid: false,
            error: result.errors.join(", "),
          });
        } else {
          resolve({ valid: true });
        }
      });
    });
  }

  /**
   * レンダリング設定のプリセット
   */
  static getPreset(preset: "default" | "large" | "small" | "dark"): RenderOptions {
    switch (preset) {
      case "large":
        return { fontSize: 28, padding: 12 };
      case "small":
        return { fontSize: 18, padding: 6 };
      case "dark":
        return {
          color: "#ffffff",
          backgroundColor: "#2f3136",
          fontSize: 24,
          padding: 10,
        };
      default:
        return MathJaxRenderer.DEFAULT_OPTIONS;
    }
  }

  /**
   * システム情報を取得
   */
  static getSystemInfo(): {
    renderer: string;
  } {
    return {
      renderer: "MathJax + Sharp",
    };
  }
}
