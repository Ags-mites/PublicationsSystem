import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsulRegistrationService } from '../consul/consul-registration.service';
import { StructuredLoggerService } from '../logging/logger.service';
import { MetricsService } from '../metrics/metrics.service';

export interface ServiceConfig {
  name: string;
  version: string;
  host: string;
  port: number;
  environment: string;
  healthCheckUrl: string;
  shutdownTimeout: number;
  gracefulShutdownEnabled: boolean;
}

export interface ShutdownHandler {
  name: string;
  priority: number; // Lower numbers execute first
  handler: () => Promise<void>;
}

@Injectable()
export class ServiceLifecycleManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServiceLifecycleManager.name);
  private serviceConfig: ServiceConfig;
  private shutdownHandlers: ShutdownHandler[] = [];
  private isShuttingDown = false;
  private startTime = Date.now();

  constructor(
    private configService: ConfigService,
    private consulService: ConsulRegistrationService,
    private structuredLogger: StructuredLoggerService,
    private metricsService: MetricsService
  ) {
    this.serviceConfig = this.getServiceConfig();
  }

  async onModuleInit() {
    try {
      await this.startupSequence();
    } catch (error) {
      this.logger.error('Service startup failed', error);
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    if (!this.isShuttingDown) {
      await this.gracefulShutdown('Module destroy');
    }
  }

  private getServiceConfig(): ServiceConfig {
    return {
      name: this.configService.get<string>('SERVICE_NAME', 'unknown-service'),
      version: this.configService.get<string>('SERVICE_VERSION', '1.0.0'),
      host: this.configService.get<string>('SERVICE_HOST', 'localhost'),
      port: this.configService.get<number>('PORT', 3000),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      healthCheckUrl: this.configService.get<string>('HEALTH_CHECK_URL', '/health'),
      shutdownTimeout: this.configService.get<number>('SHUTDOWN_TIMEOUT', 30000),
      gracefulShutdownEnabled: this.configService.get<boolean>('GRACEFUL_SHUTDOWN', true),
    };
  }

  private async startupSequence(): Promise<void> {
    this.logger.log('Starting service lifecycle management...');

    // 1. Log startup
    this.structuredLogger.info('Service starting up', {
      component: 'lifecycle',
      metadata: {
        service: this.serviceConfig.name,
        version: this.serviceConfig.version,
        environment: this.serviceConfig.environment,
        startTime: new Date().toISOString(),
      },
    });

    // 2. Register with Consul if enabled
    const consulEnabled = this.configService.get<boolean>('CONSUL_ENABLED', true);
    if (consulEnabled) {
      await this.registerWithConsul();
    }

    // 3. Setup graceful shutdown handlers
    if (this.serviceConfig.gracefulShutdownEnabled) {
      this.setupGracefulShutdown();
    }

    // 4. Setup health monitoring
    this.setupHealthMonitoring();

    // 5. Record startup metrics
    this.metricsService.incrementBusinessMetric('usersRegistered', 0); // Initialize metrics
    this.metricsService.setGauge('service_startup_timestamp', Date.now());

    const startupDuration = Date.now() - this.startTime;
    this.logger.log(`Service startup completed in ${startupDuration}ms`);

    this.structuredLogger.info('Service startup completed', {
      component: 'lifecycle',
      metadata: {
        startupDuration,
        registeredWithConsul: consulEnabled,
      },
    });
  }

  private async registerWithConsul(): Promise<void> {
    try {
      const hostname = process.env.HOSTNAME || 'local';
      const serviceId = `${this.serviceConfig.name}-${hostname}-${this.serviceConfig.port}`;

      const consulConfig = {
        id: serviceId,
        name: this.serviceConfig.name,
        address: this.serviceConfig.host,
        port: this.serviceConfig.port,
        check: {
          http: `http://${this.serviceConfig.host}:${this.serviceConfig.port}${this.serviceConfig.healthCheckUrl}`,
          interval: '30s',
          timeout: '10s',
          deregisterCriticalServiceAfter: '5m',
        },
        tags: [
          'api',
          this.serviceConfig.name,
          `v${this.serviceConfig.version}`,
          this.serviceConfig.environment,
          'lifecycle-managed',
        ],
        meta: {
          version: this.serviceConfig.version,
          environment: this.serviceConfig.environment,
          startedAt: new Date().toISOString(),
          nodeVersion: process.version,
        },
      };

      await this.consulService.registerService(consulConfig);
      this.logger.log('Service registered with Consul successfully');

      // Add Consul deregistration to shutdown handlers
      this.addShutdownHandler('consul-deregistration', 1, async () => {
        await this.consulService.deregisterService(serviceId);
      });

    } catch (error) {
      this.logger.error(`Failed to register with Consul: ${error.message}`, error);
      throw error;
    }
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach(signal => {
      process.on(signal, async () => {
        this.logger.log(`Received ${signal}, initiating graceful shutdown...`);
        await this.gracefulShutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      this.logger.error('Uncaught exception, shutting down...', error);
      this.structuredLogger.error('Uncaught exception', error, {
        component: 'lifecycle',
        metadata: { fatal: true },
      });
      await this.gracefulShutdown('uncaughtException');
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      this.logger.error('Unhandled promise rejection, shutting down...', reason as Error);
      this.structuredLogger.error('Unhandled promise rejection', reason as Error, {
        component: 'lifecycle',
        metadata: { fatal: true },
      });
      await this.gracefulShutdown('unhandledRejection');
      process.exit(1);
    });

    this.logger.log('Graceful shutdown handlers registered');
  }

  private setupHealthMonitoring(): void {
    // Monitor service health periodically
    setInterval(async () => {
      try {
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();

        // Update system metrics
        this.metricsService.setGauge('process_memory_rss_bytes', memoryUsage.rss);
        this.metricsService.setGauge('process_uptime_seconds', uptime);

        // Check for memory leaks
        const memoryThreshold = this.configService.get<number>('MEMORY_THRESHOLD_MB', 1024);
        if (memoryUsage.rss > memoryThreshold * 1024 * 1024) {
          this.structuredLogger.warn('High memory usage detected', {
            component: 'lifecycle',
            metadata: {
              memoryUsageMB: Math.round(memoryUsage.rss / 1024 / 1024),
              thresholdMB: memoryThreshold,
            },
          });
        }

      } catch (error) {
        this.logger.error('Health monitoring error', error);
      }
    }, 60000); // Check every minute
  }

  addShutdownHandler(name: string, priority: number, handler: () => Promise<void>): void {
    this.shutdownHandlers.push({ name, priority, handler });
    this.shutdownHandlers.sort((a, b) => a.priority - b.priority);
    this.logger.debug(`Added shutdown handler: ${name} (priority: ${priority})`);
  }

  removeShutdownHandler(name: string): void {
    this.shutdownHandlers = this.shutdownHandlers.filter(handler => handler.name !== name);
    this.logger.debug(`Removed shutdown handler: ${name}`);
  }

  private async gracefulShutdown(reason: string): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('Shutdown already in progress, ignoring signal');
      return;
    }

    this.isShuttingDown = true;
    const shutdownStartTime = Date.now();

    this.logger.log(`Starting graceful shutdown (reason: ${reason})...`);
    this.structuredLogger.info('Graceful shutdown initiated', {
      component: 'lifecycle',
      metadata: {
        reason,
        startTime: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });

    // Set shutdown timeout
    const shutdownTimer = setTimeout(() => {
      this.logger.error('Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, this.serviceConfig.shutdownTimeout);

    try {
      // Execute shutdown handlers in priority order
      for (const { name, handler } of this.shutdownHandlers) {
        try {
          this.logger.log(`Executing shutdown handler: ${name}`);
          const handlerStartTime = Date.now();
          
          await handler();
          
          const handlerDuration = Date.now() - handlerStartTime;
          this.logger.log(`Shutdown handler ${name} completed in ${handlerDuration}ms`);
          
        } catch (error) {
          this.logger.error(`Shutdown handler ${name} failed: ${error.message}`, error);
          // Continue with other handlers even if one fails
        }
      }

      // Final metrics and logging
      const shutdownDuration = Date.now() - shutdownStartTime;
      this.metricsService.setGauge('service_shutdown_duration_ms', shutdownDuration);

      this.structuredLogger.info('Graceful shutdown completed', {
        component: 'lifecycle',
        metadata: {
          reason,
          duration: shutdownDuration,
          handlerCount: this.shutdownHandlers.length,
        },
      });

      // Flush logs
      await this.structuredLogger.flush();

      clearTimeout(shutdownTimer);
      this.logger.log(`Graceful shutdown completed in ${shutdownDuration}ms`);
      
      process.exit(0);

    } catch (error) {
      clearTimeout(shutdownTimer);
      this.logger.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  }

  // Public methods for service status
  getServiceInfo(): any {
    return {
      name: this.serviceConfig.name,
      version: this.serviceConfig.version,
      environment: this.serviceConfig.environment,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      startTime: new Date(this.startTime).toISOString(),
      isShuttingDown: this.isShuttingDown,
      shutdownHandlers: this.shutdownHandlers.length,
      config: {
        host: this.serviceConfig.host,
        port: this.serviceConfig.port,
        healthCheckUrl: this.serviceConfig.healthCheckUrl,
        gracefulShutdownEnabled: this.serviceConfig.gracefulShutdownEnabled,
      },
    };
  }

  isHealthy(): boolean {
    return !this.isShuttingDown;
  }

  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  // Administrative methods
  async triggerShutdown(reason: string = 'manual'): Promise<void> {
    this.logger.log(`Manual shutdown triggered: ${reason}`);
    await this.gracefulShutdown(reason);
  }

  async enableMaintenanceMode(): Promise<void> {
    this.logger.log('Enabling maintenance mode');
    
    // Update Consul health check to mark as maintenance
    try {
      const serviceId = `${this.serviceConfig.name}-${process.env.HOSTNAME || 'local'}-${this.serviceConfig.port}`;
      await this.consulService.enableMaintenanceMode(serviceId, 'Manual maintenance mode');
      
      this.structuredLogger.info('Maintenance mode enabled', {
        component: 'lifecycle',
      });
    } catch (error) {
      this.logger.error('Failed to enable maintenance mode', error);
    }
  }

  async disableMaintenanceMode(): Promise<void> {
    this.logger.log('Disabling maintenance mode');
    
    try {
      const serviceId = `${this.serviceConfig.name}-${process.env.HOSTNAME || 'local'}-${this.serviceConfig.port}`;
      await this.consulService.disableMaintenanceMode(serviceId);
      
      this.structuredLogger.info('Maintenance mode disabled', {
        component: 'lifecycle',
      });
    } catch (error) {
      this.logger.error('Failed to disable maintenance mode', error);
    }
  }
}