'use strict';
const { spawnSync } = require('node:child_process');
const { targets } = require('../functions/src/admin/readerEntrypoint');
const program = `
  const start=performance.now();
  const Firestore=require('./functions/node_modules/@google-cloud/firestore');
  let documents=0,queries=0;
  Firestore.DocumentReference.prototype.get=async function(){
    documents++;
    const value=this.path.startsWith('sys_admin_access/')?{active:true,role:'admin'}
      :this.path.startsWith('quote_requests/')?{version:1,status:'new',photos:[],photoCount:0,customer:{},project:{}}
      :this.path.startsWith('orders/')?{schemaVersion:1,status:'paid',createdAt:'2026-09-05T00:00:00Z'}:null;
    return {id:this.id,ref:this,exists:value!==null,data:()=>value};
  };
  Firestore.Query.prototype.get=async function(){queries++;return {docs:[],size:0,empty:true};};
  const exports=require('./functions');const imported=performance.now();
  const fn=exports[process.env.SV_MEASURE_TARGET];
  (async()=>{
    const data={includeProducts:false,...(process.env.SV_MEASURE_TARGET==='getOrderTimelineAdminV2Gen2'?{orderId:'local-order'}:{}),...(process.env.SV_MEASURE_TARGET==='getQuoteRequestAdminGen2'?{quoteId:'local-quote'}:{})};
    const result=await fn.run({data,auth:{uid:'local-admin',token:{admin:true,firebase:{sign_in_provider:'google.com'}}},rawRequest:{headers:{}}});
    console.log('SV_RESULT:'+JSON.stringify({importIncludingFirestoreSdkMs:imported-start,totalThroughFirstHandlerMs:performance.now()-start,modules:Object.keys(require.cache).length,rss:process.memoryUsage().rss,documents,queries,resultReceived:!!result}));
  })().catch(error=>{console.error(error.code||error.name);process.exitCode=1;});
`;
const results=[];
for(const target of targets){
  const modes={};
  for(const mode of ['discovery','targeted']){
    modes[mode]=[];
    for(let index=0;index<3;index++){
      const run=spawnSync(process.execPath,['--require','./tests/commerce/helpers/no-network.cjs','-e',program],{encoding:'utf8',env:{...process.env,FUNCTION_TARGET:mode==='targeted'?target:'',SV_MEASURE_TARGET:target}});
      if(run.status!==0)throw new Error(target+': '+run.stderr.slice(-300));
      modes[mode].push(JSON.parse(run.stdout.split('\n').find(line=>line.startsWith('SV_RESULT:')).slice(10)));
    }
  }
  results.push({target,...modes});
}
console.log(JSON.stringify({node:process.version,network:'forbidden',scope:'real authorization and SDK imports; synthetic Firestore reads; empty lists / legacy order / quote without media',results},null,2));
