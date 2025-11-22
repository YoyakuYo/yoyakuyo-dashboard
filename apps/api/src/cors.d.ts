declare module 'cors' {
  import { Request, Response, NextFunction } from 'express';

  interface CorsOptions {
    origin?: boolean | string | RegExp | (string | RegExp)[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }

  type CorsCallback = (err: Error | null, options?: CorsOptions) => void;

  function cors(options?: CorsOptions | CorsCallback): (req: Request, res: Response, next: NextFunction) => void;
  function cors(origin: string | RegExp | (string | RegExp)[] | boolean, options?: CorsOptions): (req: Request, res: Response, next: NextFunction) => void;

  export = cors;
}

