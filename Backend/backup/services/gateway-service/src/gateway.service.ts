import { Injectable } from '@nestjs/common';
import Consul = require('consul');
const consul = new Consul();
@Injectable()
export class GatewayService {
  async getGatewayInfo(): Promise<object> {
    const services = await this.getDiscoveredServices();
    return {
      name: 'API Gateway',
      version: '1.0.0',
      port: process.env.PORT || 3000,
      timestamp: new Date(),
      routes: {
