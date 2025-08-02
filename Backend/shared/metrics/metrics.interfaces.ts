export interface ServiceMetrics {
  httpRequestsTotal: number;
  httpRequestDuration: number[];
  httpRequestsInFlight: number;
  databaseConnectionsActive: number;
  databaseConnectionsIdle: number;
  databaseQueriesTotal: number;
  databaseQueryDuration: number[];
  rabbitmqMessagesPublished: number;
  rabbitmqMessagesConsumed: number;
  rabbitmqConnectionsActive: number;
  memoryUsageBytes: number;
  cpuUsagePercent: number;
  customBusinessMetrics: Record<string, number>;
}

export interface MetricDefinition {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labels?: string[];
  buckets?: number[]; // For histograms
  percentiles?: number[]; // For summaries
}

export interface MetricValue {
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

export interface BusinessMetrics {
  publicationsCreated: number;
  reviewsCompleted: number;
  usersRegistered: number;
  notificationsSent: number;
  catalogItemsViewed: number;
  searchQueriesExecuted: number;
  [key: string]: number;
}

export interface SystemMetrics {
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
    percent: number;
  };
  eventLoop: {
    lag: number;
  };
  gc: {
    collections: number;
    duration: number;
  };
}

export interface HttpMetrics {
  requestsTotal: Map<string, number>;
  requestDuration: Map<string, number[]>;
  requestsInFlight: number;
  responseSizes: Map<string, number[]>;
}

export interface DatabaseMetrics {
  connectionsActive: number;
  connectionsIdle: number;
  connectionsTotal: number;
  queriesTotal: number;
  queryDuration: number[];
  poolWaitTime: number[];
  transactionsTotal: number;
  transactionDuration: number[];
}

export interface ExternalServiceMetrics {
  [serviceName: string]: {
    requestsTotal: number;
    requestDuration: number[];
    errors: number;
    timeouts: number;
    circuitBreakerState: 'open' | 'closed' | 'half-open';
  };
}