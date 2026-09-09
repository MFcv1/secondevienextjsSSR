import 'server-only';
import core from '../../../functions/src/billing/projectCostsCore.cjs';
import { getAdminDb } from './firebaseAdmin';
import { publicEnv } from './env';

const getDb = () => {
  if (publicEnv.projectId !== core.PROJECT) throw new Error('project_mismatch');
  return getAdminDb();
};
export async function readProjectCosts() {
  const db = getDb();
  const [snapshot, history] = await db.getAll(db.doc('sys_project_costs/current'), db.doc('admin_analytics_realtime/history'));
  return core.buildCostView(snapshot.data(), history.data(), Date.now(), process.env.PROJECT_COSTS_CONNECTED === 'true');
}
