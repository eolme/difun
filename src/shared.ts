import {
  SYMBOL_DEPS,
  SYMBOL_FACTORY,
  SYMBOL_NAME,
  SYMBOL_PROVIDER_CACHE,
  SYMBOL_TOKEN,
  SYMBOL_VALUE_CACHE,
} from './symbols.js';
import type {
  AnyFunction,
  AnyToken,
  AnyTokenArray,
  CreateProvider,
  CreateScope,
  EmptyArray,
  Provider,
  Token,
} from './types.js';
import { TokenType } from './types.js';

export const emptyArray: EmptyArray = [];
export const asyncTick: Promise<void> = Promise.resolve();

export const createToken: <Value>(
  type?: TokenType,
  dev_name?: string,
) => Token<Value> = process.env.NODE_ENV !== 'production'
  ? <Value>(
      type: TokenType = TokenType.NORMAL,
      dev_name = `Symbol(${TokenType[type]})`,
    ) =>
      ({
        toString: () => dev_name,
        [SYMBOL_TOKEN]: type,
        [SYMBOL_NAME]: dev_name,
      }) as Token<Value>
  : <Value>(type: TokenType = TokenType.NORMAL) =>
      ({
        [SYMBOL_TOKEN]: type,
      }) as Token<Value>;

export const createProvider = ((
  token: AnyToken,
  valueFactory: any,
  deps: AnyTokenArray = emptyArray,
) => ({
  [SYMBOL_TOKEN]: token,
  [SYMBOL_FACTORY]:
    typeof valueFactory !== 'function' ? () => valueFactory : valueFactory,
  [SYMBOL_DEPS]: deps,
})) as CreateProvider;

const destroyed: AnyFunction = () => {
  throw new Error('Scope is destroyed');
};

export const createScope = ((
  providers: ReadonlyArray<Provider<any, AnyTokenArray>>,
) => {
  const recursive: AnyToken[] | null = /*$__PURE__*/(process.env.NODE_ENV !== 'production' ? [] : null);
  let scope = {
    [SYMBOL_VALUE_CACHE]: new Map(),
    [SYMBOL_PROVIDER_CACHE]: new Map(),
    get: (token: AnyToken) => {
      if (token[SYMBOL_TOKEN] !== TokenType.GETTER) {
        if (scope[SYMBOL_VALUE_CACHE].has(token)) {
          return scope[SYMBOL_VALUE_CACHE].get(token);
        }
      }

      const provider = scope[SYMBOL_PROVIDER_CACHE].get(token);
      if (!provider) {
        throw new Error('Provider is not found');
      }

      if (process.env.NODE_ENV !== 'production') {
        /*$__PURE__*/recursive.push(token);
      }

      const deps = provider[SYMBOL_DEPS];
      const depsLength = deps.length;
      const factoryDeps = new Array<any>(depsLength);
      for (let i = 0; i < depsLength; ++i) {
        if (process.env.NODE_ENV !== 'production') {
          if (/*$__PURE__*/recursive.includes(deps[i])) {
            throw new Error(`Recursion deps ${recursive.join('->')}`);
          }

          /*$__PURE__*/recursive.push(deps[i]);
        }

        factoryDeps[i] = scope.get(deps[i]);
      }

      if (process.env.NODE_ENV !== 'production') {
        if (/*$__PURE__*/recursive[0] === token) {
          /*$__PURE__*/recursive.length = 0;
        }
      }

      const factory = provider[SYMBOL_FACTORY];
      const created = factory.apply(factory, factoryDeps as []);

      if (token[SYMBOL_TOKEN] !== TokenType.GETTER) {
        scope[SYMBOL_VALUE_CACHE].set(token, created);
      }

      return created;
    },
    update: (provider: Provider<any, AnyTokenArray>) => {
      const token = provider[SYMBOL_TOKEN];
      scope[SYMBOL_VALUE_CACHE].delete(token);
      scope[SYMBOL_PROVIDER_CACHE].set(token, provider);
    },
    dispose: (token: AnyToken) => scope[SYMBOL_VALUE_CACHE].delete(token),
    clone: () => {
      const clone = Object.assign({}, scope, {
        [SYMBOL_VALUE_CACHE]: new Map(),
      });

      scope[SYMBOL_VALUE_CACHE].forEach((value, token) => {
        if (token[SYMBOL_TOKEN] === TokenType.SINGLETON) {
          clone[SYMBOL_VALUE_CACHE].set(token, value);
        }
      });

      return clone;
    },
    destroy: () => {
      scope[SYMBOL_PROVIDER_CACHE].clear();
      scope[SYMBOL_PROVIDER_CACHE] = null as any;

      scope[SYMBOL_VALUE_CACHE].clear();
      scope[SYMBOL_VALUE_CACHE] = null as any;

      scope.get = destroyed;
      scope.update = destroyed;
      scope.dispose = destroyed;
      scope.clone = destroyed;
      scope.destroy = destroyed;

      scope.destroyed = true;

      scope = null as any;
    },
    destroyed: false,
  };

  const providerCache = scope[SYMBOL_PROVIDER_CACHE];
  for (const provider of providers) {
    providerCache.set(provider[SYMBOL_TOKEN], provider);
  }

  return scope;
}) as CreateScope;
