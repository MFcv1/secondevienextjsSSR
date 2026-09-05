'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
if (process.env.GCLOUD_PROJECT !== 'demo-secondevie-backoffice' || !/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') || process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('DEMO_EMULATOR_REQUIRED');
const admin = require('../functions/node_modules/firebase-admin');
admin.initializeApp({projectId:'demo-secondevie-backoffice'});
const db = admin.firestore();
const { createOutboxRepository } = require('../functions/src/commerce/domain/outboxRepository');
const { readAdminPage } = require('../functions/src/admin/readPage');

test.after(async () => { await admin.app().delete(); });

test('I6 transaction : une seule prise concurrente, échéance protégée et reprise ambiguë interdite', async () => {
  const repository = createOutboxRepository({db,refs:{outbox:id=>db.doc(`commerce_outbox/${id}`)}});
  const ref = db.doc('commerce_outbox/local-concurrent');
  await ref.set({status:'failed',attemptCount:1,nextAttemptAt:2000});
  await assert.rejects(repository.claim(ref.id,{leaseToken:'test-token-a',nowMillis:1000,leaseMs:1000}),/NOT_DUE/);
  const results = await Promise.allSettled(['test-token-a','test-token-b'].map(leaseToken=>repository.claim(ref.id,{leaseToken,nowMillis:2000,leaseMs:1000,expectedAttemptCount:1,expectedNextAttemptAt:2000})));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const entry = (await ref.get()).data();
  await repository.beginDelivery(ref.id,{leaseToken:entry.leaseToken,nowMillis:2001});
  const recovered = await repository.claim(ref.id,{leaseToken:'test-token-c',nowMillis:3001,leaseMs:1000});
  assert.equal(recovered.status,'delivery_unknown');
  await ref.delete();
});

test('I3 transactions sync/beacon : fermeture 120 s reste fermée après heartbeat 60 s', async () => {
  const { initLiveSession, syncSession } = require('../functions/src/analytics/sessions');
  const context = {auth:{uid:'local-visitor',token:{firebase:{sign_in_provider:'anonymous'}}}};
  const initial = await initLiveSession.run({syncProtocolVersion:1},context);
  assert.equal(initial.success,true);
  const {sessionId,syncToken,syncGeneration} = initial;
  const apply = (syncSequence,duration,sessionActive)=>syncSession.run({sessionId,syncToken,syncGeneration,syncSequence,duration,sessionActive},context);
  assert.equal((await apply(2,120,false)).success,true);
  assert.equal((await apply(1,60,true)).stale,true);
  const ref = db.doc(`analytics_sessions/${sessionId}`);
  const final = (await ref.get()).data();
  assert.equal(final.duration,120); assert.equal(final.sessionActive,false);
  const resumed = await initLiveSession.run({syncProtocolVersion:1,resumeSessionId:sessionId,resumeSyncToken:syncToken},context);
  assert.equal(resumed.success,true);
  assert.equal(resumed.resumed,true);
  assert.notEqual(resumed.syncGeneration,syncGeneration);
  assert.equal((await apply(3,121,true)).generationMismatch,true);
  await ref.delete();
  assert.equal((await apply(3,121,true)).missing,true);
});

test('I4 pagination stable : égalités de date, aucune perte/doublon et référence ancienne', async () => {
  const collection = db.collection('local_page_fixture');
  for (let index=0;index<7;index+=1) await collection.doc(`row-${index}`).set({createdAt:admin.firestore.Timestamp.fromMillis(1000),reference:`R${index}`});
  const ids=[];let cursor=null;
  do {
    const page=await readAdminPage({collection,sortField:'createdAt',pageSize:2,cursor});
    ids.push(...page.docs.map(doc=>doc.id));cursor=page.nextCursor;
  }while(cursor);
  assert.equal(ids.length,7);assert.equal(new Set(ids).size,7);
  const old=await readAdminPage({collection,sortField:'createdAt',pageSize:2,referenceField:'reference',reference:'R0'});
  assert.equal(old.docs[0].id,'row-0');
  await Promise.all(ids.map(id=>collection.doc(id).delete()));
});

test('I3 historique : reconstruction paginée de 2001 faits puis correction de durée', {timeout:60000}, async () => {
  const { contributionFor, removeMaterializedSessionFact, materializeSessionFact } = require('../functions/src/analytics/rollups');
  const session={startedAt:Date.parse('2026-09-04T12:00:00Z'),duration:120,sessionActive:false,type:'anonymous',journey:[]};
  for(let start=0;start<2001;start+=400){
    const batch=db.batch();
    for(let index=start;index<Math.min(start+400,2001);index+=1){
      const id=`page-${String(index).padStart(4,'0')}`;
      batch.set(db.doc(`analytics_session_facts/${id}`),{schemaVersion:1,shardId:'00',dateKey:'2026-09-04',contribution:contributionFor(id,session)});
    }
    await batch.commit();
  }
  await removeMaterializedSessionFact('page-0000',db);
  assert.equal((await db.doc('analytics_rollup_days/2026-09-04/summary_shards/00').get()).data().sessions,2000);
  await db.doc('analytics_sessions/correction').set(session);
  await materializeSessionFact('correction',session,db);
  await db.doc('analytics_sessions/correction').update({duration:150});
  await materializeSessionFact('correction',session,db);
  assert.equal((await db.doc('analytics_session_facts/correction').get()).data().contribution.duration,150);
  assert.equal((await db.doc('analytics_rollup_months/2026-09').get()).exists,true);
  assert.equal((await db.doc('analytics_rollup_years/2026').get()).exists,true);
});
