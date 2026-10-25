/**
 * HTMLスライドを PPTX に書き出す（SVG図解をベクターのまま保持）
 *
 * dom-to-pptx-exporter の CLI には svgAsVector を渡す口がないため、
 * Node 版エクスポータ（exportHtmlToPptx）を直接呼び、
 * pptxOptions 経由でブラウザ側の exportToPptx にオプションを届ける。
 *
 *   使い方:
 *     node export-pptx.mjs <HTMLファイル> [タイトル]
 *     node export-pptx.mjs slides/MPP_LT_slides.html "最近で気になっている〇〇"
 *
 *   オプション:
 *     --out <path>        出力先 .pptx（既定: 入力と同じ場所・同名）
 *     --selector <sel>    スライド要素のセレクタ（既定: .slide）
 *     --author <name>     作成者（既定: Yoichi Kawasaki）
 *     --no-unhide         スライドを全表示にする CSS 注入を行わない
 *
 *   タイトルを省略した場合は HTML の <title>、それも無ければファイル名を使う。
 *
 *   ■ スライドを全表示にする CSS 注入について
 *   このリポジトリのスライドHTMLは「1枚だけ .active を付けて表示し、
 *   残りは display:none で隠す」ビューア形式になっている。
 *   dom-to-pptx はセレクタに一致する要素を可視性に関係なく集めるが、
 *   display:none の要素はレイアウト矩形を持たないため中身が空の
 *   スライドとして書き出されてしまう。
 *   そこで書き出し用の一時HTMLを作り、
 *     - 全スライドを表示してタイル状に積む
 *     - JSで #stage にかかる scale 変形を打ち消す
 *     - ナビゲーションなどの画面専用UIを隠す
 *   という上書きCSSを <body> 末尾に差し込んでから読み込ませる。
 *   元のHTMLは変更しない。
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- 引数解析

const argv = process.argv.slice(2);
const opts = { author: 'Yoichi Kawasaki', selector: '.slide', unhide: true };
const positional = [];

for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '--no-unhide') {
    opts.unhide = false;
  } else if (arg === '--out' || arg === '--selector' || arg === '--author') {
    const value = argv[++i];
    if (value === undefined) {
      console.error(`✗ ${arg} には値が必要です。`);
      process.exit(1);
    }
    opts[arg.slice(2)] = value;
  } else if (arg === '-h' || arg === '--help') {
    console.log('使い方: node export-pptx.mjs <HTMLファイル> [タイトル] [--out <path>] [--selector <sel>] [--author <name>]');
    process.exit(0);
  } else if (arg.startsWith('--')) {
    console.error(`✗ 不明なオプション: ${arg}`);
    process.exit(1);
  } else {
    positional.push(arg);
  }
}

const [htmlArg, titleArg] = positional;

if (!htmlArg) {
  console.error('✗ HTMLファイルを指定してください。');
  console.error('  例: node export-pptx.mjs slides/MPP_LT_slides.html "スライドのタイトル"');
  process.exit(1);
}

const src = path.resolve(process.cwd(), htmlArg);
if (!fs.existsSync(src)) {
  console.error(`✗ ${htmlArg} が見つかりません。`);
  process.exit(1);
}

const out = opts.out
  ? path.resolve(process.cwd(), opts.out)
  : src.replace(/\.html?$/i, '.pptx');

// タイトル: 引数 > HTML の <title> > ファイル名
function titleFromHtml(file) {
  const m = fs.readFileSync(file, 'utf8').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}
const title = titleArg || titleFromHtml(src) || path.basename(src).replace(/\.html?$/i, '');

// -------------------------------------------------- エクスポータの解決

// dom-to-pptx の Node 版エクスポータを解決する
// （パッケージの exports が ./package.json を公開していないため node_modules を直接たどる）
// このディレクトリに無い場合はリポジトリ内の他のスライド環境からも探す。
const exporterCandidates = [
  path.join(__dirname, 'node_modules', 'dom-to-pptx', 'dist', 'dom-to-pptx-node.mjs'),
  path.join(__dirname, '..', '202611-web-api-intro', 'slides', 'node_modules', 'dom-to-pptx', 'dist', 'dom-to-pptx-node.mjs'),
];
const nodeExporter = exporterCandidates.find((p) => fs.existsSync(p));
if (!nodeExporter) {
  console.error('✗ Node 版エクスポータが見つかりません。探した場所:');
  for (const p of exporterCandidates) console.error(`    ${p}`);
  console.error('  `npm install dom-to-pptx` を実行してください。');
  process.exit(1);
}
const { exportHtmlToPptx } = await import(pathToFileURL(nodeExporter).href);

// -------------------------------------------------------------- 書き出し

// スライドは 1280x720 CSS px。16:9 を保ったまま 10 x 5.625 インチに割り当てる。
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const STAGE_W = 1280;
const STAGE_H = 720;

/**
 * 全スライドを可視・等倍で縦に並べる上書きCSSを差し込んだ一時HTMLを作る。
 * 一時ファイルは元HTMLと同じディレクトリに置く（相対パスの画像やCSSを壊さないため）。
 * 戻り値は { file, cleanup }。
 */
function buildExportHtml(file, selector) {
  const html = fs.readFileSync(file, 'utf8');

  const css = `
/* --- export-pptx.mjs が注入: 全スライドを書き出し対象にする --- */
html, body { overflow: visible !important; height: auto !important; }
/* JS がかける translate/scale を打ち消し、1280x720 の実寸に戻す */
#stage {
  position: static !important;
  left: auto !important; top: auto !important;
  transform: none !important;
  width: ${STAGE_W}px !important; height: auto !important;
}
/* 隠されているスライドも含めて全て表示し、重ならないよう縦に積む */
${selector} {
  position: relative !important;
  inset: auto !important;
  display: block !important;
  width: ${STAGE_W}px !important;
  height: ${STAGE_H}px !important;
  overflow: hidden !important;
}
/* タイトルスライドは flex レイアウトを保つ */
${selector}.title { display: flex !important; }
/* 画面専用UIは書き出さない */
#nav, #bar { display: none !important; }
`;

  const tag = `<style data-export-pptx>${css}</style>`;
  // </body> の直前に入れて、ページ内の既存スタイルより後に効かせる
  const injected = /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${tag}</body>`)
    : html + tag;

  const tmp = path.join(
    path.dirname(file),
    `.export-pptx-${path.basename(file, path.extname(file))}-${process.pid}.html`
  );
  fs.writeFileSync(tmp, injected);
  return {
    file: tmp,
    cleanup: () => { try { fs.unlinkSync(tmp); } catch {} },
  };
}

/**
 * docProps/core.xml のタイトル・作成者を差し替える。
 *
 * dom-to-pptx が同梱する PptxGenJS の core.xml 生成経路は
 * <dc:title>PptxGenJS Presentation</dc:title> / <dc:creator>PptxGenJS</dc:creator>
 * を文字列として直書きしており、pptxOptions の title/author が反映されない。
 * ライブラリ本体には手を入れず、書き出し後のZIPを開いて上書きする。
 * jszip が解決できない場合は、PPTX自体は正常なので警告のみで続行する。
 */
async function withDocProps(buffer, docTitle, docAuthor) {
  let JSZip;
  try {
    const jszipPath = path.join(path.dirname(nodeExporter), '..', '..', 'jszip');
    JSZip = await import(pathToFileURL(path.join(jszipPath, 'lib', 'index.js')).href)
      .then((m) => m.default || m)
      .catch(() => import('jszip').then((m) => m.default || m));
  } catch {
    console.warn('\n  ! jszip が見つからないため、タイトル/作成者の書き換えをスキップしました。');
    return buffer;
  }

  try {
    const zip = await JSZip.loadAsync(buffer);
    const entry = zip.file('docProps/core.xml');
    if (!entry) return buffer;

    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const xml = (await entry.async('string'))
      .replace(/<dc:title>[\s\S]*?<\/dc:title>/, `<dc:title>${esc(docTitle)}</dc:title>`)
      .replace(/<dc:subject>[\s\S]*?<\/dc:subject>/, `<dc:subject>${esc(docTitle)}</dc:subject>`)
      .replace(/<dc:creator>[\s\S]*?<\/dc:creator>/, `<dc:creator>${esc(docAuthor)}</dc:creator>`)
      .replace(/<cp:lastModifiedBy>[\s\S]*?<\/cp:lastModifiedBy>/, `<cp:lastModifiedBy>${esc(docAuthor)}</cp:lastModifiedBy>`);

    zip.file('docProps/core.xml', xml);
    return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  } catch (err) {
    console.warn(`\n  ! タイトル/作成者の書き換えに失敗しました（PPTX自体は有効です）: ${err.message}`);
    return buffer;
  }
}

const prepared = opts.unhide ? buildExportHtml(src, opts.selector) : null;
const target = prepared ? prepared.file : src;

process.stdout.write(`→ ${path.relative(process.cwd(), src)} を書き出し中 (svgAsVector: true) ... `);

try {
  const buffer = await exportHtmlToPptx(target, {
    selector: opts.selector,
    // 1280x720 の実寸で描画させ、レイアウトの取りこぼしを防ぐ
    browserWidth: STAGE_W,
    browserHeight: STAGE_H,
    // 全スライドを縦に積むため、ビューポートは画面外も含めて確保しない。
    // （高さは #stage を auto にしてあるのでドキュメント側で伸びる）
    pptxOptions: {
      svgAsVector: true,          // SVG図解をラスタ化せずベクターで保持する
      slideWidth: SLIDE_W,
      slideHeight: SLIDE_H,
      title,
      author: opts.author,
    },
  });

  fs.writeFileSync(out, await withDocProps(buffer, title, opts.author));
  const kb = (buffer.length / 1024).toFixed(0);
  console.log(`完了  (${path.relative(process.cwd(), out)}, ${kb} KB)`);
} catch (err) {
  console.log('失敗');
  console.error(`  ${err.message}`);
  process.exitCode = 1;
} finally {
  if (prepared) prepared.cleanup();
}
