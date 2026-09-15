import { Request, Response, NextFunction } from 'express';

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated access attempt.' });
    }

    const isDaEndpoint = req.originalUrl.startsWith('/api/da') || req.originalUrl.startsWith('/api/v1/da');
    const isStateEndpoint = req.originalUrl.startsWith('/api/state') || req.originalUrl.startsWith('/api/v1/state');
    const isCentralEndpoint = req.originalUrl.startsWith('/api/central') || req.originalUrl.startsWith('/api/v1/central');
    const userRole = req.user.role;

    // Allow DA / State / Central access if user has DA, STATE, CENTRAL, MP, or ADMIN role in interactive demo portal
    if ((isDaEndpoint || isStateEndpoint || isCentralEndpoint) && ['DISTRICT_AUTHORITY', 'DA', 'STATE_AUTHORITY', 'STATE', 'CENTRAL_AUTHORITY', 'CENTRAL', 'MP_MLA', 'MP', 'ADMIN'].includes(userRole)) {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Access forbidden: Role '${userRole}' lacks sufficient privileges for this endpoint. Required role(s): [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}
