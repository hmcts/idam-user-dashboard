import { Request, Response, NextFunction } from 'express';

export function wrapMethod(
  target: object,
  key: string | symbol,
  descriptor: TypedPropertyDescriptor<(req: Request, res: Response, next: NextFunction) => Promise<any>>
) {
  const fn = descriptor.value;

  if (typeof fn !== 'function') {
    throw new TypeError(`@wrapMethod decorator can only be applied to methods not: ${typeof fn}`);
  }

  descriptor.value = async function (...args) {
    try {
      // pass args to original function
      await fn.apply(this, args);
    } catch (err) {
      // call next() function with err
      if(args[2]) return args[2](err);
      if(typeof args[0].next === 'function') return args[0].next(err);
    }
  };

  return descriptor;
}


export function wrapClass(target: any) {
  Reflect.ownKeys(target.prototype).forEach(key => {
    // Ignore constructor
    if (key === 'constructor') {
      return;
    }

    const descriptor = Object.getOwnPropertyDescriptor(target.prototype, key);

    // Only wrap functions
    if (typeof descriptor.value === 'function') {
      Object.defineProperty(target.prototype, key, wrapMethod(target, key, descriptor));
    }
  });

  return target;
}

export default function asyncError(...args: any[]) {
  if (args.length === 1) {
    return wrapClass(args[0] as Function);
  }

  return wrapMethod(args[0], args[1], args[2]);
}
