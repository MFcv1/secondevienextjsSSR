import test from 'node:test';
import assert from 'node:assert/strict';
import { createRetainedRead, createReadLease } from '../src/kit/admin/retainedRead.js';
import { createAnalyticsChannel } from '../src/kit/admin/adminAnalyticsRealtimeStore.js';

test('Stats : 30 retours ne recréent pas les lectures ; pause, fraîcheur, révocation', () => {
  let starts = 0, stops = 0, timer;
  const callbacks = [];
  const read = createRetainedRead((next, error) => {
    starts++; callbacks.push({next,error}); return () => { stops++; };
  }, { visibility: () => null, schedule: fn => { timer = fn; return 1; }, cancel: () => { timer = null; } });
  const received = [];
  const next = value => received.push(value);
  let unsubscribe = read.subscribe(next, () => {});
  callbacks[0].next({docs:[{id:'finance'}],size:1,metadata:{fromCache:false}});
  for (let index=0;index<30;index++) { unsubscribe(); unsubscribe = read.subscribe(next, () => {}); }
  assert.equal(starts,1); assert.equal(stops,0);
  assert.equal(received.at(-1).metadata.fromCache,false);
  unsubscribe(); timer();
  assert.equal(stops,1); assert.equal(read.get().metadata.fromCache,true);
  unsubscribe = read.subscribe(next, () => {});
  assert.equal(starts,2);
  callbacks[1].next({docs:[],size:0,metadata:{fromCache:true}});
  assert.equal(read.get().size,1);
  assert.equal(read.get().metadata.fromCache,true);
  callbacks[0].next({docs:[],size:0,metadata:{fromCache:false}});
  assert.equal(read.get().size,1); // ancienne connexion ignorée
  callbacks[1].next({docs:[{id:'new'}],size:1,metadata:{fromCache:false}});
  assert.equal(read.get().docs[0].id,'new');
  read.clear(); assert.equal(read.get(),null);
  callbacks[1].next({docs:[],size:0,metadata:{fromCache:false}});
  assert.equal(read.get(),null);
});

test('onglet masqué : arrêt immédiat ; retour visible : reprise ; hors page : délai borné', () => {
  let starts=0,stops=0,timer;
  const lease=createReadLease({start:()=>starts++,pause:()=>stops++,schedule:fn=>{timer=fn;return 1;},cancel:()=>{timer=null;}});
  lease.update(true); assert.equal(starts,1);
  lease.update(false); assert.equal(stops,0);
  lease.update(true); assert.equal(timer,null);
  lease.update(true,false); assert.equal(stops,1);
  lease.update(true,true); assert.equal(starts,3);
  lease.update(false); timer(); assert.equal(stops,2);
  lease.dispose();
});

test('Data : reprise conserve les KPI connus, attend serveur et rejette une ancienne connexion', () => {
  const callbacks=[];
  const channel=createAnalyticsChannel(next=>{callbacks.push(next);return ()=>{};},snapshot=>snapshot.value);
  channel.setOwner('admin-a'); channel.start();
  const data={recent:{epoch:'test',revision:1},history:{epoch:'test',revision:1}};
  callbacks[0]({metadata:{fromCache:false},value:data});
  channel.pause(); assert.equal(channel.getSnapshot().status,'cached');
  channel.start(); assert.equal(channel.getSnapshot().data,data);
  callbacks[1]({metadata:{fromCache:true},docs:[]});
  assert.equal(channel.getSnapshot().data,data);
  assert.equal(channel.getSnapshot().status,'cached');
  callbacks[0]({metadata:{fromCache:false},value:{}});
  assert.equal(channel.getSnapshot().status,'cached');
  callbacks[1]({metadata:{fromCache:false},value:data});
  assert.equal(channel.getSnapshot().status,'ready');
  channel.setOwner('admin-b'); assert.equal(channel.getSnapshot().data,null);
});
