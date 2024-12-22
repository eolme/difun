import {
  asyncTick,
  createProvider,
  createScope,
  emptyArray,
} from './shared.js';
import {
  SYMBOL_PROVIDER_CACHE,
  SYMBOL_TOKEN,
  SYMBOL_VALUE_CACHE,
} from './symbols.js';
import type {
  AnyToken,
  AnyTokenArray,
  EmptyArray,
  GlobalProvide,
  GlobalScope,
  Scope,
  Token,
} from './types.js';
import { TokenType } from './types.js';

export { createProvider, createScope, createToken } from './shared.js';
export { TokenType };

let globalScope: GlobalScope | null = null;

const createGlobalScope = () =>
  createScope(emptyArray) as unknown as GlobalScope;

export const execute = <T = void>(
  callback: () => T,
  errback: (reason: unknown) => T,
): T => {
  try {
    return callback();
  } catch (ex: unknown) {
    return errback(ex);
  } finally {
    destroy();
  }
};

export const executeAsync = <T = void>(
  callback: () => Promise<T> | T,
  errback: (reason: unknown) => Promise<T> | T,
): Promise<T> => {
  const promise = asyncTick.then(callback, errback);
  promise.then(destroy, destroy);
  return promise;
};

export const populate = (scope: Scope<EmptyArray>): void => {
  if (globalScope === null) {
    globalScope = createGlobalScope();
  }

  const providerCache = globalScope[SYMBOL_PROVIDER_CACHE];
  scope[SYMBOL_PROVIDER_CACHE].forEach((provider, token) => {
    providerCache.set(token, provider);
  });

  const valueCache = globalScope[SYMBOL_VALUE_CACHE];
  scope[SYMBOL_VALUE_CACHE].forEach((value, token) => {
    if (token[SYMBOL_TOKEN] !== TokenType.GETTER) {
      valueCache.set(token, value);
    }
  });
};

export const destroy = (): void => {
  if (globalScope && !globalScope.destroyed) {
    globalScope.destroy();
  }

  globalScope = null;
};

export const provide = ((
  token: AnyToken,
  valueFactory: any,
  deps: AnyTokenArray = emptyArray,
): void => {
  if (globalScope === null) {
    globalScope = createGlobalScope();
  }

  globalScope.update(createProvider(token, valueFactory, deps));
}) as GlobalProvide;

export const inject = <Value>(token: Token<Value>): Value => {
  if (globalScope === null) {
    globalScope = createGlobalScope();
  }

  return globalScope.get(token);
};
