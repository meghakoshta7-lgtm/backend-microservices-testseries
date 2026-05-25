import 'module-alias/register';
import { startMicroservice } from '@/bootstrap';

startMicroservice().catch((error) => {
  console.error('Failed to start service:', error);
  process.exit(1);
});
