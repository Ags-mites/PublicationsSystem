import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ServiceMetrics,
  MetricDefinition,
  MetricValue,
  BusinessMetrics,
  SystemMetrics,
  HttpMetrics,
  DatabaseMetrics,
  ExternalServiceMetrics,
} from './metrics.interfaces';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private readonly serviceName: string;
  private readonly version: string;
  private readonly environment: string;

  // Metric storage
  private counters = new Map<string, Map<string, number>>();
  private gauges = new Map<string, Map<string, number>>();
  private histograms = new Map<string, Map<string, number[]>>();
  private summaries = new Map<string, Map<string, number[]>>();

  // Predefined metrics
  private httpMetrics: HttpMetrics = {
    requestsTotal: new Map(),
    requestDuration: new Map(),
    requestsInFlight: 0,
    responseSizes: new Map(),
  };

  private databaseMetrics: DatabaseMetrics = {
    connectionsActive: 0,
    connectionsIdle: 0,
    connectionsTotal: 0,
    queriesTotal: 0,
    queryDuration: [],
    poolWaitTime: [],
    transactionsTotal: 0,
    transactionDuration: [],
  };

  private externalServiceMetrics: ExternalServiceMetrics = {};
  private businessMetrics: BusinessMetrics = {
    publicationsCreated: 0,
    reviewsCompleted: 0,
    usersRegistered: 0,
    notificationsSent: 0,
    catalogItemsViewed: 0,
    searchQueriesExecuted: 0,
  };

  private startTime = Date.now();

  constructor(private configService: ConfigService) {
    this.serviceName = this.configService.get<string>('SERVICE_NAME', 'unknown');
    this.version = this.configService.get<string>('SERVICE_VERSION', '1.0.0');
    this.environment = this.configService.get<string>('NODE_ENV', 'development');
  }

  onModuleInit() {
    this.initializeDefaultMetrics();
    this.startSystemMetricsCollection();
  }

  private initializeDefaultMetrics(): void {
    // Initialize HTTP metrics
    this.registerCounter('http_requests_total', 'Total HTTP requests', ['method', 'route', 'status_code']);
    this.registerHistogram('http_request_duration_seconds', 'HTTP request duration', ['method', 'route'], 
      [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]);
    this.registerGauge('http_requests_in_flight', 'Current HTTP requests in flight');

    // Initialize database metrics
    this.registerGauge('database_connections_active', 'Active database connections');
    this.registerGauge('database_connections_idle', 'Idle database connections');
    this.registerCounter('database_queries_total', 'Total database queries', ['operation', 'table']);
    this.registerHistogram('database_query_duration_seconds', 'Database query duration', ['operation'], 
      [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]);

    // Initialize system metrics
    this.registerGauge('process_uptime_seconds', 'Process uptime');
    this.registerGauge('process_memory_usage_bytes', 'Process memory usage', ['type']);
    this.registerGauge('process_cpu_usage_percent', 'Process CPU usage');

    // Initialize business metrics
    this.registerCounter('business_publications_created_total', 'Total publications created');
    this.registerCounter('business_reviews_completed_total', 'Total reviews completed');
    this.registerCounter('business_users_registered_total', 'Total users registered');
    this.registerCounter('business_notifications_sent_total', 'Total notifications sent');

    this.logger.log('Default metrics initialized');
  }

  private startSystemMetricsCollection(): void {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Collect every 30 seconds
  }

  private collectSystemMetrics(): void {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Update system gauges
      this.setGauge('process_uptime_seconds', uptime);
      this.setGauge('process_memory_usage_bytes', memoryUsage.rss, { type: 'rss' });
      this.setGauge('process_memory_usage_bytes', memoryUsage.heapTotal, { type: 'heap_total' });
      this.setGauge('process_memory_usage_bytes', memoryUsage.heapUsed, { type: 'heap_used' });
      this.setGauge('process_memory_usage_bytes', memoryUsage.external, { type: 'external' });

      // CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      this.setGauge('process_cpu_usage_percent', cpuPercent);

    } catch (error) {
      this.logger.error('Failed to collect system metrics', error);
    }
  }

  // Metric registration methods
  registerCounter(name: string, help: string, labels: string[] = []): void {
    if (!this.counters.has(name)) {
      this.counters.set(name, new Map());
    }
  }

  registerGauge(name: string, help: string, labels: string[] = []): void {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new Map());
    }
  }

  registerHistogram(name: string, help: string, labels: string[] = [], buckets: number[] = []): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new Map());
    }
  }

  registerSummary(name: string, help: string, labels: string[] = [], percentiles: number[] = []): void {
    if (!this.summaries.has(name)) {
      this.summaries.set(name, new Map());
    }
  }

  // Metric update methods
  incrementCounter(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    const labelKey = this.serializeLabels(labels);
    const metricMap = this.counters.get(name);
    
    if (metricMap) {
      const currentValue = metricMap.get(labelKey) || 0;
      metricMap.set(labelKey, currentValue + value);
    }
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const labelKey = this.serializeLabels(labels);
    const metricMap = this.gauges.get(name);
    
    if (metricMap) {
      metricMap.set(labelKey, value);
    }
  }

  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const labelKey = this.serializeLabels(labels);
    const metricMap = this.histograms.get(name);
    
    if (metricMap) {
      let values = metricMap.get(labelKey) || [];
      values.push(value);
      
      // Keep only recent values to prevent memory leaks
      if (values.length > 10000) {
        values = values.slice(-5000);
      }
      
      metricMap.set(labelKey, values);
    }
  }

  observeSummary(name: string, value: number, labels: Record<string, string> = {}): void {
    const labelKey = this.serializeLabels(labels);
    const metricMap = this.summaries.get(name);
    
    if (metricMap) {
      let values = metricMap.get(labelKey) || [];
      values.push(value);
      
      // Keep only recent values
      if (values.length > 10000) {
        values = values.slice(-5000);
      }
      
      metricMap.set(labelKey, values);
    }
  }

  // HTTP metrics methods
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number, responseSize?: number): void {
    const labels = { method, route, status_code: statusCode.toString() };
    
    this.incrementCounter('http_requests_total', 1, labels);
    this.observeHistogram('http_request_duration_seconds', duration / 1000, labels);
    
    if (responseSize) {
      this.observeHistogram('http_response_size_bytes', responseSize, labels);
    }

    // Update internal HTTP metrics
    const key = `${method}_${route}_${statusCode}`;
    this.httpMetrics.requestsTotal.set(key, (this.httpMetrics.requestsTotal.get(key) || 0) + 1);
    
    let durations = this.httpMetrics.requestDuration.get(key) || [];
    durations.push(duration);
    this.httpMetrics.requestDuration.set(key, durations);
  }

  incrementHttpRequestsInFlight(): void {
    this.httpMetrics.requestsInFlight++;
    this.setGauge('http_requests_in_flight', this.httpMetrics.requestsInFlight);
  }

  decrementHttpRequestsInFlight(): void {
    this.httpMetrics.requestsInFlight = Math.max(0, this.httpMetrics.requestsInFlight - 1);
    this.setGauge('http_requests_in_flight', this.httpMetrics.requestsInFlight);
  }

  // Database metrics methods
  recordDatabaseQuery(operation: string, table: string, duration: number): void {
    const labels = { operation, table };
    
    this.incrementCounter('database_queries_total', 1, labels);
    this.observeHistogram('database_query_duration_seconds', duration / 1000, { operation });
    
    this.databaseMetrics.queriesTotal++;
    this.databaseMetrics.queryDuration.push(duration);
  }

  setDatabaseConnections(active: number, idle: number): void {
    this.databaseMetrics.connectionsActive = active;
    this.databaseMetrics.connectionsIdle = idle;
    this.databaseMetrics.connectionsTotal = active + idle;
    
    this.setGauge('database_connections_active', active);
    this.setGauge('database_connections_idle', idle);
  }

  // Business metrics methods
  incrementBusinessMetric(metric: keyof BusinessMetrics, value: number = 1): void {
    this.businessMetrics[metric] += value;
    this.incrementCounter(`business_${metric}_total`, value);
  }

  // External service metrics methods
  recordExternalServiceCall(serviceName: string, duration: number, success: boolean): void {
    if (!this.externalServiceMetrics[serviceName]) {
      this.externalServiceMetrics[serviceName] = {
        requestsTotal: 0,
        requestDuration: [],
        errors: 0,
        timeouts: 0,
        circuitBreakerState: 'closed',
      };
    }

    const serviceMetrics = this.externalServiceMetrics[serviceName];
    serviceMetrics.requestsTotal++;
    serviceMetrics.requestDuration.push(duration);
    
    if (!success) {
      serviceMetrics.errors++;
    }

    const labels = { service: serviceName, success: success.toString() };
    this.incrementCounter('external_service_requests_total', 1, labels);
    this.observeHistogram('external_service_duration_seconds', duration / 1000, { service: serviceName });
  }

  // Prometheus format export
  getPrometheusMetrics(): string {
    const lines: string[] = [];
    
    // Add service info
    lines.push('# HELP service_info Service information');
    lines.push('# TYPE service_info gauge');
    lines.push(`service_info{service="${this.serviceName}",version="${this.version}",environment="${this.environment}"} 1`);
    lines.push('');

    // Export counters
    for (const [metricName, metricMap] of this.counters.entries()) {
      lines.push(`# HELP ${metricName} Counter metric`);
      lines.push(`# TYPE ${metricName} counter`);
      
      for (const [labelKey, value] of metricMap.entries()) {
        const labels = this.formatLabelsForPrometheus(labelKey);
        lines.push(`${metricName}${labels} ${value}`);
      }
      lines.push('');
    }

    // Export gauges
    for (const [metricName, metricMap] of this.gauges.entries()) {
      lines.push(`# HELP ${metricName} Gauge metric`);
      lines.push(`# TYPE ${metricName} gauge`);
      
      for (const [labelKey, value] of metricMap.entries()) {
        const labels = this.formatLabelsForPrometheus(labelKey);
        lines.push(`${metricName}${labels} ${value}`);
      }
      lines.push('');
    }

    // Export histograms
    for (const [metricName, metricMap] of this.histograms.entries()) {
      lines.push(`# HELP ${metricName} Histogram metric`);
      lines.push(`# TYPE ${metricName} histogram`);
      
      for (const [labelKey, values] of metricMap.entries()) {
        if (values.length > 0) {
          const labels = this.formatLabelsForPrometheus(labelKey);
          const buckets = [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
          
          // Calculate bucket counts
          for (const bucket of buckets) {
            const count = values.filter(v => v <= bucket).length;
            lines.push(`${metricName}_bucket{${labels.slice(1, -1)},le="${bucket}"} ${count}`);
          }
          
          // Add +Inf bucket
          lines.push(`${metricName}_bucket{${labels.slice(1, -1)},le="+Inf"} ${values.length}`);
          
          // Add count and sum
          const sum = values.reduce((a, b) => a + b, 0);
          lines.push(`${metricName}_count${labels} ${values.length}`);
          lines.push(`${metricName}_sum${labels} ${sum}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // JSON format export
  getMetricsJson(): ServiceMetrics {
    return {
      httpRequestsTotal: Array.from(this.httpMetrics.requestsTotal.values()).reduce((a, b) => a + b, 0),
      httpRequestDuration: Array.from(this.httpMetrics.requestDuration.values()).flat(),
      httpRequestsInFlight: this.httpMetrics.requestsInFlight,
      databaseConnectionsActive: this.databaseMetrics.connectionsActive,
      databaseConnectionsIdle: this.databaseMetrics.connectionsIdle,
      databaseQueriesTotal: this.databaseMetrics.queriesTotal,
      databaseQueryDuration: this.databaseMetrics.queryDuration,
      rabbitmqMessagesPublished: 0, // To be implemented
      rabbitmqMessagesConsumed: 0, // To be implemented
      rabbitmqConnectionsActive: 0, // To be implemented
      memoryUsageBytes: process.memoryUsage().rss,
      cpuUsagePercent: 0, // Simplified
      customBusinessMetrics: this.businessMetrics,
    };
  }

  // Utility methods
  private serializeLabels(labels: Record<string, string>): string {
    const sortedKeys = Object.keys(labels).sort();
    return sortedKeys.map(key => `${key}:${labels[key]}`).join(',');
  }

  private formatLabelsForPrometheus(labelKey: string): string {
    if (!labelKey) return '';
    
    const labelPairs = labelKey.split(',').map(pair => {
      const [key, value] = pair.split(':');
      return `${key}="${value}"`;
    });
    
    return `{${labelPairs.join(',')}}`;
  }

  // Administrative methods
  resetMetrics(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.summaries.clear();
    
    this.httpMetrics = {
      requestsTotal: new Map(),
      requestDuration: new Map(),
      requestsInFlight: 0,
      responseSizes: new Map(),
    };
    
    this.initializeDefaultMetrics();
    this.logger.log('Metrics reset');
  }

  getMetricsSummary(): any {
    const totalRequests = Array.from(this.httpMetrics.requestsTotal.values()).reduce((a, b) => a + b, 0);
    
    return {
      service: this.serviceName,
      version: this.version,
      environment: this.environment,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      totalRequests,
      requestsInFlight: this.httpMetrics.requestsInFlight,
      databaseConnections: this.databaseMetrics.connectionsActive,
      memoryUsage: Math.round(process.memoryUsage().rss / 1024 / 1024),
      businessMetrics: this.businessMetrics,
    };
  }
}