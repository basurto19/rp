import dns from 'node:dns';

export const configureDns = (): void => {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
};
