import { Router } from 'express';
import { microservices } from '@/microservices/registry';

const router = Router();

microservices.gateway.routes.forEach(({ path, router: routeRouter }) => {
  router.use(path, routeRouter);
});

export default router;
