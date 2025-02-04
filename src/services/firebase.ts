import { initializeApp, cert } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "tnscchat",
  credential: cert({
    projectId: "tnscchat",
    clientEmail: "firebase-adminsdk-qdngq@tnscchat.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDe9J0QKvmGt2gC\nziZsOXyy9duSu/xgLVTI1dLfaOMuhR3MVXWHZp69p/fMx107PkbKnl8Z25zg+LGy\nvpLMZ+LspXqTfz2+w8/2svVzkCXyNYVL8kVskziEWCuGZwZAZOvNPg/eg2FeEcIx\nmA1jdG6LKf3joEB97fPaPyw87+ycMEfSheOdxhMXqoe52S0cUqhTn7wBEZ5SwfrU\nofZTqa6Nzn9fxcMQ/kawYO/yCbAZ4wZDstAPA1CUWQw2+p61i1kbrswKBJm6FdtJ\nmmQl38FZImhPM2nVqHtY1/Lm09QI4e4+dm3zEtNcgSBSogxI8hpywXA8mdE9biFL\nhYugzK0xAgMBAAECggEAAISYddBnvn6gFPuWHsO+bKsCDNP3eOC6FPJcOE0l0/aW\ntGIRcRRVs5KXkof3CTtyjidyiJyYP3SMcyIatLNcFVkoEP4nblFFoyjUxaU01Vx2\n+A9yxlcMN1B+H2SPYOhrHNGzVzy+ZenMJfHYvB2p4RRipNv7Ml+yZJQnfee/yLgZ\n4dnCLQzpTVp/dyE3gkqwB5uNZ4LYVWg+ZluSnDJIa3+J4cP1zj2Ndua1CuIpd/hX\nJM9E4pLbD44KsdQ5mwgPs/TS5laAi1vnPCsbnWFKMr45/Is6y/F5c9iZY6+w+vnT\nHd/p3Yofch1qSZ5cd3WE294HVvaknzfmmhk9tSM1/QKBgQD+3QY/QPW42muePTBM\nKqILj7JFaGjzby0YrXWQ4r3GkChy+e9LE8JI6o0NLgOYgY2Xa5EI8EbMeFSeOnCK\nkeuzCWpfWkkAAmmFg9O/yJlyR0lbYnv+ltN24qGt+JjatMvlDvzzFwrnPZ9Z5krl\nyzJfHz3tOPypygbzLhQlEN/c3QKBgQDf8ykAvjDc8lZWJVaszgyNIsqNnAXUFKI9\nM2j7ellsxc9yCMh6LI2eAhIxpCchCpKdQIctiEM52xv4gKr6ENjYEIpyTLFKFRTY\nzgbmzUBKz46uTyNMsEtQbbfD0e4wHVi3uHYiPf6y+NzlDYJN4xSH0CE4M/wDHMU5\nC6Gl0g8SZQKBgF0LaBpzpsHDzAJLKHTGI77AyT6Zrach8X7O5NruTIZPXtUK9hec\nsRNZvgEPyXRF5+Fd/ecbgV1omMvjXe7Y8wm76D/DgF8mgkuiIw4jOBIGgHuCau45\nNh5zAr+2wGcoFkAbxrEgunRNhP2XG8Tk+BDOIReX9HYwMXVaXzRhArlpAoGAbjCA\nfkMWW8BJRr28de40MsVpkF+yZnV4llBTWVkL4v85YMx9h8+gJpyyQwaX0iQXm5QC\nbx7apP7wNkdo2P2tFDKfTDn8CY1x4nMM5kcbWTPi6lU58yPTCtHRV2JVpgrqegsi\n5RpH1dupJHKPKK+QjHqVvcemOgnP6I+Wi7ZdgBkCgYAZVKrojHAiE4Xf9FF2n5wM\njC0rBpeVkaBRxczj/Of+QLwF32/eQc65KGuqzfcnryp1pSMF4+yRm49eTHSuWmY/\nKm9GABTuozyjXseBb9/q3wlbD1G1TGhtQmyWWcYYcl+Mk45wiAJrBuySj3rWG26+\nPsWtMXOVsIBlUVm6ilR+2w==\n-----END PRIVATE KEY-----\n"
  }),
  authDomain: "tnscchat.firebaseapp.com", 
  storageBucket: "tnscchat.appspot.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const signInWithFirebaseToken = async (token: string) => {
  try {
    const userCredential = await signInWithCustomToken(auth, token);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase authentication error:', error);
    throw error;
  }
};