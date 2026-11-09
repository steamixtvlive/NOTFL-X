// Uygulamanın kendi renderer kodunu dağıtım sırasında hafifçe karıştırır.
// Bu yalnızca kaynak kodu okumayı zorlaştırır; bir güvenlik sınırı veya DRM değildir.
import fs from 'node:fs/promises';
import path from 'node:path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const root = path.resolve(import.meta.dirname, '..');
const inputPath = path.join(root, 'src', 'renderer.js');
const outputPath = path.join(root, 'dist-build', 'renderer.js');
const source = await fs.readFile(inputPath, 'utf8');
const result = JavaScriptObfuscator.obfuscate(source, {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: false,
  stringArray: true,
  stringArrayThreshold: 0.5,
  transformObjectKeys: false,
  unicodeEscapeSequence: false
});
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, result.getObfuscatedCode(), 'utf8');
console.log(`Renderer obfuscation ready: ${path.relative(root, outputPath)}`);
