import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export type UserRole = 'client' | 'admin'
export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres.')
  }
  return secret
}

export function createToken(user: AuthUser): string {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '1d'
  return jwt.sign(user, jwtSecret(), { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] })
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.header('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Debes iniciar sesión para continuar.' })
    return
  }

  try {
    req.user = jwt.verify(token, jwtSecret()) as AuthUser
    next()
  } catch {
    res.status(401).json({ error: 'La sesión no es válida o ha expirado.' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Esta operación requiere permisos de administrador.' })
    return
  }
  next()
}