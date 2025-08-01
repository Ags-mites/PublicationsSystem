import { ConfigService } from '@nestjs/config';
import Consul = require('consul');

let consulInstance;
let registeredServiceId: string;

export function getConsulClient(configService: ConfigService) {
  if (!consulInstance) {
    consulInstance = new Consul({
      host: configService.get('CONSUL_HOST', 'localhost'),
      port: configService.get<number>('CONSUL_PORT', 8500),
    });
  }
  return consulInstance;
}

export async function registerWithConsul(
  configService: ConfigService,
  port: number,
  apiPrefix: string
): Promise<void> {
  const consul = getConsulClient(configService);
  const serviceName = configService.get<string>('SERVICE_NAME', 'publications-service');
  const serviceHost = configService.get<string>('SERVICE_HOST', 'localhost');

  const serviceId = `${serviceName}-${process.env.NODE_ENV === 'development' ? 'dev' : Date.now()}`;
  registeredServiceId = serviceId;

  try {
    // Intentar deregistrar si es en desarrollo
    if (process.env.NODE_ENV === 'development') {
      try {
        await consul.agent.service.deregister(serviceId);
      } catch {
        // ignorar error si no existía antes
      }
    }

    await consul.agent.service.register({
      id: serviceId,
      name: serviceName,
      address: serviceHost,
      port: parseInt(port.toString(), 10),
      tags: ['publications', 'microservice'],
      check: {
        name: `${serviceName}-health-check`,
        http: `http://${serviceHost}:${port}/${apiPrefix}/publications/health`,
        interval: '10s',
        timeout: '5s',
      },
      meta: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    });

    console.log(`Service registered with Consul as ${serviceId}`);
  } catch (error) {
    console.warn('Consul registration failed:', error.message);
  }
}

export async function deregisterFromConsul(configService: ConfigService): Promise<void> {
  const consul = getConsulClient(configService);

  if (!registeredServiceId) return;

  try {
    await consul.agent.service.deregister(registeredServiceId);
    console.log(`Service deregistered from Consul: ${registeredServiceId}`);
  } catch (error) {
    console.warn('Consul deregistration failed:', error.message);
  }
}
