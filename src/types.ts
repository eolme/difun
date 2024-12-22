import type {
  SYMBOL_DEPS,
  SYMBOL_FACTORY,
  SYMBOL_NAME,
  SYMBOL_PROVIDER_CACHE,
  SYMBOL_TOKEN,
  SYMBOL_VALUE_CACHE,
} from './symbols.js';

type UniqueSymbol = { readonly value: unique symbol }['value'];
type UniqueType<Value> = { readonly [_ in UniqueSymbol]: Value };

type AnyArray = ReadonlyArray<unknown>;
export type AnyFunction = (...params: any[]) => any;

export type EmptyArray = readonly [];
type EmptyRecord = Record<never, never>;

export type Token<Value> = {
  readonly toString?: (() => string) | undefined;
  readonly [SYMBOL_TOKEN]: TokenType;
  readonly [SYMBOL_NAME]?: string | undefined;
} & UniqueType<Value>;

export type AnyToken = Token<any>;
export type AnyTokenArray = ReadonlyArray<AnyToken>;

type InferDep<Dep> = Dep extends Token<infer TokenValue>
  ? readonly [TokenValue]
  : EmptyArray;

type InferDeps<Deps extends AnyArray> = Deps extends AnyTokenArray
  ? Deps extends readonly [infer Dep, ...infer RestDeps]
    ? readonly [...InferDep<Dep>, ...InferDeps<RestDeps>]
    : EmptyArray
  : EmptyArray;

export type Provider<Value, Deps extends AnyTokenArray = EmptyArray> = {
  [SYMBOL_TOKEN]: Token<Value>;
  [SYMBOL_FACTORY]: (...deps: InferDeps<Deps>) => Value;
  [SYMBOL_DEPS]: Deps;
};

export type CreateProvider = {
  <T extends AnyToken = AnyToken>(
    token: T,
    value: T extends Token<infer Value> ? Value : never,
  ): Provider<T extends Token<infer Value> ? Value : never, EmptyArray>;
  <T extends AnyToken = AnyToken, Deps extends AnyTokenArray = EmptyArray>(
    token: T,
    factory: T extends Token<infer Value>
      ? (...deps: InferDeps<Deps>) => Value
      : never,
    deps?: Deps | undefined,
  ): Provider<T extends Token<infer Value> ? Value : never, Deps>;
};

type InferScopeProviders<ScopeProviders extends AnyArray> =
  ScopeProviders extends readonly [
    infer ScopeProvider,
    ...infer RestScopeProviders,
  ]
    ? InferScopeProviders<RestScopeProviders> &
        (ScopeProvider extends Provider<
          infer ScopeProviderValue,
          infer ScopeProviderDeps
        >
          ? {
              get: (token: Token<ScopeProviderValue>) => ScopeProviderValue;
              update: (
                provider: Provider<ScopeProviderValue, ScopeProviderDeps>,
              ) => void;
              dispose: (token: Token<ScopeProviderValue>) => boolean;
            }
          : EmptyRecord)
    : EmptyRecord;

export type Scope<Providers extends readonly Provider<any, AnyTokenArray>[]> =
  InferScopeProviders<Providers> & {
    [SYMBOL_VALUE_CACHE]: Map<AnyToken, any>;
    [SYMBOL_PROVIDER_CACHE]: Map<AnyToken, Provider<any, AnyTokenArray>>;
    clone: () => Scope<Providers>;
    destroy: () => void;
    destroyed: boolean;
  };

export type GlobalScope = {
  [SYMBOL_VALUE_CACHE]: Map<AnyToken, any>;
  [SYMBOL_PROVIDER_CACHE]: Map<AnyToken, Provider<any, AnyTokenArray>>;
  get: <Value>(token: Token<Value>) => Value;
  update: <Value, Deps extends AnyTokenArray = EmptyArray>(
    provider: Provider<Value, Deps>,
  ) => void;
  dispose: <Value>(token: Token<Value>) => boolean;
  destroy: () => void;
  destroyed: boolean;
};

export type CreateScope = <
  Providers extends ReadonlyArray<Provider<any, AnyTokenArray>>,
>(
  providers: Providers,
) => Scope<Providers>;

export type GlobalProvide = {
  <T extends AnyToken = AnyToken>(
    token: T,
    value: T extends Token<infer Value> ? Value : never,
  ): void;
  <T extends AnyToken = AnyToken, Deps extends AnyTokenArray = EmptyArray>(
    token: T,
    factory: T extends Token<infer Value>
      ? (...deps: InferDeps<Deps>) => Value
      : never,
    deps?: Deps | undefined,
  ): void;
};

export enum TokenType {
  NORMAL = 1,
  GETTER = 2,
  SINGLETON = 3,
}
