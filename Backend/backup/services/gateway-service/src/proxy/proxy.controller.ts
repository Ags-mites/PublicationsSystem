import { All, Controller, Req, Res, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { AuthenticatedRequest } from '../auth/auth.middleware';
@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);
  constructor(private proxyService: ProxyService) {}
  @All('*')
  async handleProxyRequest(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    this.logger.debug(`Received request: ${req.method} ${req.originalUrl}`);
    await this.proxyService.proxyRequest(req, res);
  }
}