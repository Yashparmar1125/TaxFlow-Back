import { Request, Response } from 'express';
import os from 'os';
import prisma from '../config/prisma';
import env from '../config/env.config';
import pkg from '../../package.json';

class SystemController {
  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);

    return parts.join(' ');
  }

  public getHealth = async (req: Request, res: Response) => {
    const startTime = Date.now();
    let dbStatus = 'ok';

    try {
      // Periodic lightweight check for database connectivity
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'error';
    }

    const uptimeSeconds = Math.floor(process.uptime());
    const memoryUsage = process.memoryUsage();

    const healthData = {
      status: dbStatus === 'ok' ? 'ok' : 'error',
      service: {
        name: pkg.name || 'complianceos-backend',
        environment: env.NODE_ENV,
        version: pkg.version || '1.0.0',
      },
      time: {
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: uptimeSeconds,
          human: this.formatUptime(uptimeSeconds),
        },
        responseTimeMs: Date.now() - startTime,
      },
      system: {
        hostname: os.hostname(),
        platform: process.platform,
        cpuCores: os.cpus().length,
        loadAverage: os.loadavg(),
      },
      memory: {
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        externalMB: Math.round(memoryUsage.external / 1024 / 1024),
      },
      runtime: {
        nodeVersion: process.version,
        pid: process.pid,
      },
      dependencies: {
        database: dbStatus,
      },
    };

    const statusCode = dbStatus === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthData);
  };
}

export const systemController = new SystemController();
