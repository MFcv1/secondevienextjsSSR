import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { app, appId } from './firebaseCore';
import { getFirebaseAuth, getGoogleProvider, loadAuthModule } from './firebaseLazy';

const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');

export {
  app,
  db,
  functions,
  appId,
  getFirebaseAuth,
  getGoogleProvider,
  loadAuthModule,
};
