import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
      interface Request {
          currentUser?: any;
      }
  }
}

const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  console.log("here is req.header('Authorization')",req.header('Authorization'));
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserPayload;
    console.log("here is decoded id :",decoded);
    req.currentUser = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid Token' });
  }
};

const authenticateUser  = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.currentUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
}

const authenticateOwner =  (req: Request, res: Response, next: NextFunction): void => {
  console.log("here is req.currentUser",req.currentUser);
  if (req.currentUser?.role !== 'owner') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
}

const authenticateAgent = (req: Request, res: Response, next: NextFunction): void => {
  if (req.currentUser?.role !== 'agent') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
}

const authenticateSuperAgent = (req: Request, res: Response, next: NextFunction): void => {
  if (req.currentUser?.role !== 'super-agent') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
}

const authenticateAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.currentUser?.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
}

export { authenticateUser, authenticateOwner,authenticateSuperAgent,authenticateAgent,authenticateAdmin };
export default authenticateToken;