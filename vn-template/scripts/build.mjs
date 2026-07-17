import { compile } from './lib/compile.mjs';

const r = compile();
console.log(`✅ 构建完成：${r.sceneCount} 个场景 -> dist/（OpenWebGal 项目）`);
console.log(`   场景：${r.sceneIds.join(', ')}`);
console.log('   下一步：npm run preview 预览，或 npm run export 导出 zip。');
