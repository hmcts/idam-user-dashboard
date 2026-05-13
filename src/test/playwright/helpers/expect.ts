import { expect as baseExpect } from '@playwright/test';

const MAX_VALUE_LENGTH = 160;

type ExpectFactory = (actual: unknown, message?: string) => unknown;

function truncate(value: string): string {
  if (value.length <= MAX_VALUE_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_VALUE_LENGTH - 3)}...`;
}

function formatRegExp(value: RegExp): string {
  const readableSource = value.source.replace(/\\\//g, '/');
  return truncate(value.flags ? `${readableSource} (${value.flags})` : readableSource);
}

function formatValue(value: unknown): string {
  if (value instanceof RegExp) {
    return formatRegExp(value);
  }
  if (typeof value === 'string') {
    return `"${truncate(value)}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return truncate(JSON.stringify(value));
  }
  if (typeof value === 'function') {
    return `[Function ${value.name || 'anonymous'}]`;
  }

  try {
    return truncate(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function describeTarget(actual: unknown): string {
  if (
    typeof actual === 'string'
    || typeof actual === 'number'
    || typeof actual === 'boolean'
    || actual === null
    || actual === undefined
    || actual instanceof RegExp
    || Array.isArray(actual)
  ) {
    return `value ${formatValue(actual)}`;
  }

  const target = String(actual);
  if (target === '[object Object]') {
    const constructorName = actual?.constructor?.name;
    if (constructorName && constructorName !== 'Object') {
      return constructorName;
    }
    return `value ${formatValue(actual)}`;
  }
  return truncate(target);
}

function isPlaywrightLocatorTarget(actual: unknown): boolean {
  return /^(locator|getBy[A-Za-z]*|frameLocator)\(/.test(String(actual));
}

function describeTargetSuffix(actual: unknown): string {
  if (isPlaywrightLocatorTarget(actual)) {
    return ' at';
  }

  return ` at ${describeTarget(actual)}`;
}

function describeExpected(matcherName: string, args: unknown[]): string {
  if (args.length === 0) {
    return '';
  }

  if (matcherName === 'toHaveAttribute') {
    return ` ${formatValue(args[0])}=${formatValue(args[1])}`;
  }

  if (matcherName === 'toHaveCSS') {
    return ` ${formatValue(args[0])}=${formatValue(args[1])}`;
  }

  return ` ${formatValue(args[0])}`;
}

function buildMessage(matcherName: string, actual: unknown, args: unknown[], isNot: boolean): string {
  const negation = isNot ? 'not ' : '';
  return `${negation}${matcherName}${describeExpected(matcherName, args)}${describeTargetSuffix(actual)}`;
}

function wrapMatchers(assertion: unknown, actual: unknown, factory: ExpectFactory, isNot = false): unknown {
  return new Proxy(assertion as object, {
    get(target, property, receiver) {
      if (property === 'not') {
        return wrapMatchers(Reflect.get(target, property, receiver), actual, factory, !isNot);
      }

      const matcher = Reflect.get(target, property, receiver);
      if (typeof matcher !== 'function' || typeof property !== 'string') {
        return matcher;
      }

      return (...args: unknown[]) => {
        const message = buildMessage(property, actual, args, isNot);
        const assertionWithMessage = factory(actual, message) as Record<string, unknown>;
        const scopedAssertion = isNot
          ? assertionWithMessage.not as Record<string, unknown>
          : assertionWithMessage;
        return (scopedAssertion[property] as (...matcherArgs: unknown[]) => unknown)(...args);
      };
    },
  });
}

function wrapExpectFactory(factory: ExpectFactory): ExpectFactory {
  return (actual: unknown, message?: string) => {
    const assertion = factory(actual, message);
    if (message) {
      return assertion;
    }
    return wrapMatchers(assertion, actual, factory);
  };
}

const detailedExpect = new Proxy(wrapExpectFactory(baseExpect as ExpectFactory), {
  get(target, property, receiver) {
    if (property === 'soft') {
      return wrapExpectFactory(baseExpect.soft as ExpectFactory);
    }
    return Reflect.get(baseExpect, property, receiver) || Reflect.get(target, property, receiver);
  },
});

export const expect = detailedExpect as typeof baseExpect;
