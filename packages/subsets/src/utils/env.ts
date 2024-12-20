// 判断 js 运行时

export const isJsDom =
    typeof navigator === 'object' &&
    navigator.userAgent &&
    navigator.userAgent.includes('jsdom');
const Deno = globalThis.Deno;

export const isDeno = typeof Deno === 'object' && Deno.version;
export const isNode =
    !isDeno &&
    typeof globalThis.process === 'object' &&
    !!globalThis.process.versions &&
    !!globalThis.process.versions.node;
export const isBrowser =
    typeof window === 'object' &&
    typeof document === 'object' &&
    document.nodeType === 9;

/* 判断 worker 环境 */
export const isInWorker = ((): 'classic' | 'module' | false => {
    if (
        globalThis.self &&
        typeof (globalThis as any).importScripts === 'function'
    ) {
        try {
            (globalThis as any).importScripts();
            return 'classic';
        } catch (e) {
            return 'module';
        }
    }
    return false;
})();

/** node、browser、deno 皆为主线程，worker_ 开头皆为 worker 内部 */
export const env = isNode
    ? 'node'
    : isDeno
    ? 'deno'
    : isBrowser
    ? 'browser'
    : isInWorker
    ? (('worker_' + isInWorker) as 'worker_classic' | 'worker_module')
    : 'unknown';
