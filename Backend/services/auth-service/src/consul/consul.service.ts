import { ConfigService } from '@nestjs/config';
import Consul = require('consul');

export async function registerWithConsul(
  configService: ConfigService,
  port: number,
  apiPrefix: string
): Promise<void> {
  const consul = new Consul({
    host: configService.get('CONSUL_HOST', 'localhost'),
    port: configService.get('CONSUL_PORT', 8500)
  });

  const serviceName = configService.get('SERVICE_NAME', 'auth-service');
  const serviceId = `${serviceName}-${Date.now()}`;

  try {
    await consul.agent.service.register({
      name: serviceName,
      id: serviceId,
      address: configService.get('SERVICE_HOST', 'localhost'),
      port: port,
      tags: ['auth', 'microservice'],
      check: {
        name: `${serviceName}-health-check`,
        http: `http://localhost:${port}/${apiPrefix}/health`,
        interval: '10s',
        timeout: '5s'
      }
    });
    console.log(`Service registered with Consul as ${serviceId}`);
  } catch (error) {
    console.warn('Consul registration failed:', error.message);
  }

  return;
}

export async function deregisterFromConsul(consul: Consul, serviceId: string): Promise<void> {
  try {
    await consul.agent.service.deregister(serviceId);
    console.log('Service deregistered from Consul');
  } catch (error) {
    console.warn('Consul deregistration failed:', error.message);
  }
}