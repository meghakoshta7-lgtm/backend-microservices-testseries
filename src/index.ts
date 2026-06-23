import 'module-alias/register';
import dns from 'dns';

// Use Google DNS for MongoDB SRV resolution (must be before mongoose loads)
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { startMicroservice } from '@/bootstrap';

startMicroservice().catch((error) => {
  console.error('Failed to start service:', error);
  process.exit(1);
});
