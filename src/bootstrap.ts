import { config } from '@/config';
import { connectDB } from '@/config/database';
import { createApp } from '@/app';
import { getMicroservice } from '@/microservices/registry';

export const startMicroservice = async (serviceName = process.env.SERVICE_NAME || 'gateway') => {
  const service = getMicroservice(serviceName);
  const port = Number(process.env.PORT || service.defaultPort || config.port);
  const app = createApp(service);

  await connectDB();

  const server = app.listen(port, () => {
    console.log(`${service.name} service running in ${config.env} mode on port ${port}`);
    console.log(`API: http://localhost:${port}/api`);
    console.log(`Health: http://localhost:${port}/health`);
  });

  return { app, server, service, port };
};
