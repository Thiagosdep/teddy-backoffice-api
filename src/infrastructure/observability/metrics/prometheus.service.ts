import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly registry: client.Registry;
  private httpRequestsTotal: client.Counter<string>;
  private httpRequestDuration: client.Histogram<string>;
  private httpRequestsInProgress: client.Gauge<string>;
  private httpRequestErrors: client.Counter<string>;

  constructor() {
    this.registry = new client.Registry();

    client.collectDefaultMetrics({ register: this.registry });

    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.httpRequestsInProgress = new client.Gauge({
      name: 'http_requests_in_progress',
      help: 'Number of HTTP requests in progress',
      labelNames: ['method', 'path'],
      registers: [this.registry],
    });

    this.httpRequestErrors = new client.Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });
  }

  recordHttpRequest(
    method: string,
    path: string,
    status: number,
    duration: number,
  ): void {
    this.httpRequestsTotal.inc({ method, path, status });
    this.httpRequestDuration.observe({ method, path, status }, duration);

    if (status >= 400) {
      this.httpRequestErrors.inc({ method, path, status });
    }
  }

  startHttpRequest(method: string, path: string): void {
    this.httpRequestsInProgress.inc({ method, path });
  }

  endHttpRequest(method: string, path: string): void {
    this.httpRequestsInProgress.dec({ method, path });
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
