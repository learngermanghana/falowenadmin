const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const {resolveChatModel,buildChatRequest}=require('./chatModelConfig');
test('production marking request has an explicit output budget and retains JSON',async()=>{
 const source=fs.readFileSync(__dirname+'/index.js','utf8');const start=source.indexOf('async function callOpenAiForMarking(');const code=source.slice(start,source.indexOf('\n}',start)+2);
 let request;
 const context={openAiApiKeySecret:{value:()=> 'test-key'},process:{env:{}},resolveChatModel,buildChatRequest,buildMarkingPrompt:()=> 'Return JSON',console:{info:()=>{}},normalizeAiMarkingResult:()=>({detectedParts:[],writingStrengths:[],corrections:[]}),fetch:async(url,options)=>{request=JSON.parse(options.body);return {ok:true,text:async()=>JSON.stringify({choices:[{message:{content:'{}'}}]})};}};
 vm.createContext(context);vm.runInContext(code,context);await context.callOpenAiForMarking({});
 assert.equal(request.max_completion_tokens,4096);assert.equal(request.reasoning_effort,'none');assert.equal(request.response_format.type,'json_object');
});
