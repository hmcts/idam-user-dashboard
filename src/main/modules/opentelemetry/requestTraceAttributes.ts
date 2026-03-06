import { trace, Span, AttributeValue } from '@opentelemetry/api';

const REQUEST_TRACE_ATTRIBUTES_KEY = '__idamRequestTraceAttributes';

type RequestWithTraceAttributes = {
  [REQUEST_TRACE_ATTRIBUTES_KEY]?: Record<string, AttributeValue>;
};

function toAttributeValue(value: unknown): AttributeValue {
  if (Array.isArray(value)) {
    const filtered = value.filter(v => ['string', 'number', 'boolean'].includes(typeof v));
    if (filtered.length > 0) {
      return filtered as AttributeValue;
    }
    return String(value);
  }

  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return value as AttributeValue;
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export function setRequestTraceAttribute(req: unknown, attrName: string, attrValue: unknown): void {
  if (!req || typeof req !== 'object') {
    return;
  }

  const typedReq = req as RequestWithTraceAttributes;
  if (!typedReq[REQUEST_TRACE_ATTRIBUTES_KEY]) {
    typedReq[REQUEST_TRACE_ATTRIBUTES_KEY] = {};
  }
  typedReq[REQUEST_TRACE_ATTRIBUTES_KEY]![attrName] = toAttributeValue(attrValue);
}

export function applyRequestTraceAttributesToSpan(span: Span, req: unknown): void {
  if (!req || typeof req !== 'object') {
    return;
  }

  const typedReq = req as RequestWithTraceAttributes;
  const attributes = typedReq[REQUEST_TRACE_ATTRIBUTES_KEY];
  if (!attributes) {
    return;
  }

  Object.entries(attributes).forEach(([key, value]) => span.setAttribute(key, value));
}

export function setTelemetryAttribute(req: unknown, attrName: string, attrValue: unknown): void {
  const normalizedValue = toAttributeValue(attrValue);
  trace.getActiveSpan()?.setAttribute(attrName, normalizedValue);
  setRequestTraceAttribute(req, attrName, normalizedValue);
}
