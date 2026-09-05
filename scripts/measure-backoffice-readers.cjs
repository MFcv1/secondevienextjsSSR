'use strict';
const { spawnSync } = require('node:child_process');
const { targets } = require('../functions/src/admin/readerEntrypoint');
const repetitions = 3;
const program = `
  const started=performance.now();
  const exports=require('./functions');
  const imported=performance.now();
  const reader=exports[process.env.SV_MEASURE_TARGET];
  (async()=>{
    const first=performance.now();let outcome;
    try{await reader.run({data:{},auth:null});outcome='unexpected-success';}catch(error){outcome=error.code||error.name;}
    console.log('SV_RESULT:'+JSON.stringify({importMs:imported-started,firstRejectedHandlerMs:performance.now()-first,modules:Object.keys(require.cache).length,rss:process.memoryUsage().rss,outcome,endpoint:reader.__endpoint,exportNames:Object.keys(exports).sort()}));
  })();
`;
const results = [];
for (const target of targets) {
  const variants = {};
  for (const mode of ['discovery', 'targeted']) {
    variants[mode] = [];
    for (let index = 0; index < repetitions; index += 1) {
      const run = spawnSync(process.execPath, ['--require', './tests/commerce/helpers/no-network.cjs', '-e', program], {
        cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, FUNCTION_TARGET: mode === 'targeted' ? target : '', SV_MEASURE_TARGET: target }
      });
      if (run.status !== 0) throw new Error(`Reader measure failed: ${target}/${mode}`);
      const result = JSON.parse(run.stdout.split('\n').find(line=>line.startsWith('SV_RESULT:')).slice(10));
      variants[mode].push(result);
    }
  }
  if (JSON.stringify(variants.discovery[0].endpoint) !== JSON.stringify(variants.targeted[0].endpoint)) throw new Error(`Endpoint changed: ${target}`);
  results.push({ target, ...variants });
}
console.log(JSON.stringify({ node: process.version, repetitions, network: 'forbidden', handlerScope: 'authorization rejection only; authorized Firestore latency not measured', results }, null, 2));
