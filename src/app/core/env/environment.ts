export const environment = {
  apiUrl: 'https://prog-gate.cloud/backend/api',
  production: false,
  meta: {
    appId: '1506133857645770',
    configId: '1623379982850888',
    redirectUri: 'https://prog-gate.cloud/meta/callback',
    apiVersion: 'v21.0',
  },
  socketIo: {
    url: 'https://prog-gate.cloud/',
    options: {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 500000,
      withCredentials: true,
      forceNew: false,
      autoConnect: false,
      upgrade: true,
      rememberUpgrade: true
    }
  }
};