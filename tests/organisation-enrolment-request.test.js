import { test } from 'node:test';
import assert from 'node:assert/strict';
import { organisationEnrolmentRequest as request } from '../src/utils/organisationEnrolmentRequest.js';
import handler, { proxyToFalowenFunction } from '../api/router.js';
const reply = (data,status=200) => new Response(typeof data === 'string' ? data : JSON.stringify(data),{status});
test('public submission sends the same request ID on retry and returns receipt',async()=>{
  const body={requestId:'fixed-id',students:[{name:'Example'}]};let calls=0;
  const fetchImpl=async(url,options)=>{calls++;assert.equal(url,'/api/organisation-enrolments');assert.equal(options.method,'POST');assert.equal(options.headers.Accept,'application/json');assert.equal(JSON.parse(options.body).requestId,'fixed-id');return reply({ok:true,reference:'fixed-id'});};
  assert.equal((await request('organisation-enrolments',body,{fetchImpl})).reference,'fixed-id');await request('organisation-enrolments',body,{fetchImpl});assert.equal(calls,2);
});
test('HTML success, HTML errors, empty body and invalid JSON have actionable errors',async()=>{for(const response of [reply('<!DOCTYPE html><html>Fallback</html>'),reply('<!DOCTYPE html>Unavailable',503),reply(''),reply('invalid')]){await assert.rejects(request('organisation-enrolments',{}, {fetchImpl:async()=>response}), /unexpected page.*entries are still here/);}});
test('server validation and duplicate errors remain readable',async()=>{for(const status of [400,409,429]) await assert.rejects(request('organisation-enrolments',{}, {fetchImpl:async()=>reply({ok:false,error:'Review this student'},status)}), /Review this student/);});
test('network error preserves entries and offers retry',async()=>{await assert.rejects(request('organisation-enrolments',{}, {fetchImpl:async()=>{throw new Error('offline');}}), /entries are still here/);});
test('private review cannot send a request without a token',async()=>{await assert.rejects(request('admin/organisation-enrolments',null,{staff:true,fetchImpl:()=>assert.fail('must not fetch')}),/Sign in/);});
test('list and approval attach owner token and use correct methods',async()=>{const calls=[];const deps={staff:true,getToken:async()=> 'owner-token',fetchImpl:async(url,options)=>{calls.push([url,options]);return reply({ok:true});}};await request('admin/organisation-enrolments',null,deps);await request('admin/organisation-enrolments/batch/review',{index:0,decision:'approve'},deps);assert.equal(calls[0][1].method,'GET');assert.equal(calls[1][1].method,'POST');assert.equal(calls[1][1].headers.Authorization,'Bearer owner-token');});
function responseMock(){return {code:200,data:null,status(s){this.code=s;return this;},json(data){this.data=data;return this;},send(){assert.fail('must not forward HTML');},setHeader(){}};}
test('proxy converts upstream HTML into a JSON 502 for submission and review',async()=>{const saved=global.fetch;try{global.fetch=async()=>reply('<!DOCTYPE html>Not found',404);for(const path of ['organisation-enrolments','admin/organisation-enrolments/batch/review']){const res=responseMock();await proxyToFalowenFunction({method:'POST',headers:{},body:{}},res,path,new URL('https://example.org'));assert.equal(res.code,502);assert.equal(res.data.ok,false);assert.match(res.data.error,/temporarily unavailable/);}}finally{global.fetch=saved;}});
test('router dispatches public submission and private review routes to Firebase',async()=>{const saved=global.fetch;try{global.fetch=async(url,options)=>{assert.match(url,/cloudfunctions.net\/api\/(?:admin\/)?organisation-enrolments/);return reply({ok:false,error:'Validation'},400);};for(const path of ['organisation-enrolments','admin/organisation-enrolments']){const res=responseMock();await handler({method:'POST',url:`/api/${path}`,headers:{host:'admin.falowen.app'},body:{}},res);assert.equal(res.code,400);assert.equal(res.data.error,'Validation');}}finally{global.fetch=saved;}});

test('organisation directory has a dedicated Vercel rewrite before the catch-all router', async () => {
  const { readFileSync } = await import('node:fs');
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const direct = config.rewrites.findIndex(({ source }) => source === '/api/admin/organisations');
  const fallback = config.rewrites.findIndex(({ source }) => source === '/api/(.*)');
  assert.ok(direct >= 0 && direct < fallback, 'directory must bypass generic API catch-all');
  assert.equal(config.rewrites[direct].destination, 'https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/admin/organisations');
});
test('router proxies authorised organisation directory GET, preserving bearer token and Firebase response', async () => {
  const saved = global.fetch;
  try {
    const calls = [];
    global.fetch = async (url, options) => {
      calls.push({ url, options });
      assert.equal(url, 'https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/admin/organisations');
      assert.equal(options.method, 'GET');
      assert.equal(options.headers.authorization, 'Bearer staff-token');
      return reply({ ok: true, organisations: [{ id: 'organisation-1', name: 'School' }], truncated: false });
    };
    const res = responseMock();
    await handler({ method: 'GET', url: '/api/router?path=admin%2Forganisations', headers: { host: 'admin.falowen.app', authorization: 'Bearer staff-token' } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.data.organisations[0].name, 'School');
    assert.equal(calls.length, 1);
  } finally { global.fetch = saved; }
});
test('organisation directory rejects methods other than GET at the router', async () => {
  const saved = global.fetch;
  try {
    global.fetch = () => assert.fail('POST must not reach Firebase');
    const res = { ...responseMock(), setHeader() {} };
    await handler({ method: 'POST', url: '/api/admin/organisations', headers: { host: 'admin.falowen.app' }, body: {} }, res);
    assert.equal(res.code, 405);
  } finally { global.fetch = saved; }
});
test('partner API proxy preserves tokens for profile reads and owner activation', async () => {
 const saved=global.fetch;
 try {
  for (const [path,method] of [['organisation-partners/me','GET'],['admin/organisation-partners/prepare','POST']]) {
   global.fetch=async(url,options)=>{assert.ok(url.endsWith('/'+path));assert.equal(options.headers.authorization,'Bearer scoped-token');return reply({ok:true});};
   const res=responseMock();await handler({method,url:'/api/'+path,headers:{authorization:'Bearer scoped-token',host:'admin.falowen.app'},body:{}},res);assert.equal(res.data.ok,true);
  }
 } finally {global.fetch=saved;}
});
