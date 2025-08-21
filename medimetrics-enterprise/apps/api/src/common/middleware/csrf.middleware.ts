import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for safe methods
    if (this.safeMethods.includes(req.method)) {
      return next();
    }

    // Skip for API endpoints that use JWT
    if (req.path.startsWith('/api/v') && req.headers.authorization) {
      return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    next();
  }
}