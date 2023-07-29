import { InputTemplate, SubsetResult } from '../interface';
import { NameTable } from './reporter';

const trans: Record<string, number> = {
    'extra light': 200,
    'ultra light': 200,
    light: 300,
    normal: 400,
    regular: 400,
    medium: 500,
    'semi bold': 600,
    'demi bold': 600,
    bold: 700,
    'extra bold': 800,
    'ultra bold': 800,
    heavy: 900,
    black: 900,
};

export const subFamilyToWeight = (str: string) => {
    const items = str.split(' ');
    let weight = 400;
    items.some((i) => {
        if (i in trans) {
            weight = trans[i];
            return true;
        }
    });
    return weight;
};

export const isItalic = (str: string) => {
    return str.toLowerCase().includes('italic');
};
export const createCSS = (
    subsetResult: SubsetResult,
    nameTable: NameTable,
    opts: {
        css: InputTemplate['css'];
        compress: boolean;
    }
) => {
    const fontData = Object.fromEntries(
        Object.entries(nameTable).map(([key, val]) => {
            return [key, typeof val === 'string' ? val : val.en];
        })
    );
    const css = opts.css || {};
    const family =
        // fontData.preferredFamily  不使用这个，因为这个容易引起歧义
        css.fontFamily || fontData.fontFamily;

    const preferredSubFamily =
        fontData.preferredSubFamily || fontData.fontSubFamily || '';

    const style =
        css.fontStyle || (isItalic(preferredSubFamily) ? 'italic' : 'normal');

    const locals =
        typeof css.localFamily === 'string'
            ? [css.localFamily]
            : css.localFamily ?? [];
    locals.push(fontData.fontFamily);

    const polyfills =
        typeof css.polyfill === 'string'
            ? [
                  {
                      name: css.polyfill,
                      format: getKeyWordsFromFontPath(css.polyfill),
                  },
              ]
            : css.polyfill?.map((i) =>
                  typeof i === 'string'
                      ? {
                            name: i,
                            format: getKeyWordsFromFontPath(i),
                        }
                      : i
              ) ?? [];

    const weight = css.fontWeight || subFamilyToWeight(preferredSubFamily);
    const cssStyleSheet = subsetResult
        .map(({ path, unicodeRange }) => {
            return `@font-face {
font-family: "${family}";
src:${[
                ...locals.map((i) => `local("${i}")`),
                `url("./${path}") format("woff2")`,
                ...polyfills.map(
                    (i) =>
                        `url("${i.name}") ${
                            i.format ? `format("${i.format}")` : ''
                        }`
                ),
            ].join(',')};
font-style: ${style};
font-weight: ${weight};
font-display: ${css.fontDisplay || 'swap'};
unicode-range:${unicodeRange};
}`;
        })
        .join('\n');
    const header =
        '/*Generated By cn-font-split https://www.npmjs.com/package/@konghayao/cn-font-split;Origin File Name Table:\n' +
        Object.entries(fontData)
            .map((i) => i.join(': '))
            .join('\n') +
        '\n */\n\n';
    return header + cssStyleSheet;
};

const KeyWordsMap = {
    '.otc': 'collection',
    '.ttc': 'collection',
    '.eot': 'embedded-opentype',
    '.otf': 'opentype',
    '.ttf': 'truetype',
    '.svg': 'svg',
    '.svgz': 'svg',
    '.woff': 'woff',
    '.woff2': 'woff2',
};

const getKeyWordsFromFontPath = (path: string) => {
    const all = Object.keys(KeyWordsMap) as (keyof typeof KeyWordsMap)[];
    for (const iterator of all) {
        if (path.endsWith(iterator)) {
            return KeyWordsMap[iterator];
        }
    }
    return undefined;
};
