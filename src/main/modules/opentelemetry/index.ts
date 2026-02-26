import { useAzureMonitor, AzureMonitorOpenTelemetryOptions } from '@azure/monitor-opentelemetry';
import { trace, ProxyTracerProvider } from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { HttpInstrumentationConfig } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { IncomingMessage } from 'http';
import { RequestOptions } from 'https';
import config from 'config';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';

export function initializeTelemetry() {

  console.log('initializeTelemetry');

  // Filter using HTTP instrumentation configuration
  const httpInstrumentationConfig: HttpInstrumentationConfig = {
    enabled: true,
    ignoreIncomingRequestHook: (request: IncomingMessage) => {
      // Ignore OPTIONS incoming requests
      if (request.method === 'OPTIONS') {
        return true;
      }
      if (request.url?.match(/\/assets\/|\.js|\.css/)) {
        return true;
      } else {
        console.log('request for %j', request.url);
      }
      return false;
    },
    ignoreOutgoingRequestHook: (options: RequestOptions) => {
      // Ignore outgoing requests with /health path
      if (options.path === '/health') {
        return true;
      }
      return false;
    }
  };

  const customResource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.get('services.insightname') as string,
  });

  const options: AzureMonitorOpenTelemetryOptions = {
    azureMonitorExporterOptions: {
      connectionString: config.get('appInsights.connectionString')
    },
    // Sampling could be configured here
    samplingRatio: 1.0,
    resource: customResource,
    instrumentationOptions: {
      http: httpInstrumentationConfig,
      azureSdk: { enabled: true }
    },
  };

  useAzureMonitor(options);

  // Need client to be created
  addOpenTelemetryInstrumentation();
  console.log('instrumentation initialized');
}

function addOpenTelemetryInstrumentation() {
  const tracerProvider = (trace.getTracerProvider() as ProxyTracerProvider).getDelegate();
  registerInstrumentations({
    instrumentations: [
      new ExpressInstrumentation(),
      new WinstonInstrumentation()
    ],
    tracerProvider: tracerProvider,
  });
}
