import { useAzureMonitor, AzureMonitorOpenTelemetryOptions } from "@azure/monitor-opentelemetry";
import { trace, Span, SpanKind, TraceFlags, ProxyTracerProvider } from '@opentelemetry/api';
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { Resource } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { ReadableSpan, SpanProcessor } from "@opentelemetry/sdk-trace-base";
import { HttpInstrumentationConfig } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { IncomingMessage } from "http";
import { RequestOptions } from "https";
import config from 'config';

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
                console.log('skipping request for %j', request.url);
                return true;
            } else {
                console.log('request for %j', request.url);
            }
            return false;
        },
        ignoreOutgoingRequestHook: (options: RequestOptions) => {
            return false;
        }
    };

    const customResource = Resource.EMPTY;
    // ----------------------------------------
    // Setting role name and role instance
    // ----------------------------------------
    customResource.attributes[SEMRESATTRS_SERVICE_NAME] = config.get('services.insightname');

    console.log('service name ' + customResource.attributes[SEMRESATTRS_SERVICE_NAME]);

    const options: AzureMonitorOpenTelemetryOptions = {
        azureMonitorExporterOptions: {
            connectionString: config.get('appInsights.connectionString')
        },
        // Sampling could be configured here
        samplingRatio: 1,
        // Use custom Resource
        resource: customResource as any,
        instrumentationOptions: {
            http: httpInstrumentationConfig,
            azureSdk: { enabled: true }
        },
    };

    addSpanProcessor(options);
    useAzureMonitor(options);

    // Need client to be created
    addOpenTelemetryInstrumentation();
    console.log('instrumentation initialized');
}

function addOpenTelemetryInstrumentation() {
    const tracerProvider = (trace.getTracerProvider() as ProxyTracerProvider).getDelegate();
    registerInstrumentations({
        instrumentations: [
            new ExpressInstrumentation()
        ],
        tracerProvider: tracerProvider,
    });
}

function addSpanProcessor(options: AzureMonitorOpenTelemetryOptions) {
    // Custom SpanProcessor class
    class SpanEnrichingProcessor implements SpanProcessor {
        forceFlush(): Promise<void> {
            return Promise.resolve();
        }
        shutdown(): Promise<void> {
            return Promise.resolve();
        }
        onStart(_span: Span): void { }
        onEnd(span: ReadableSpan) {

            // Telemetry can be Filtered out here
            if (span.kind == SpanKind.INTERNAL) {
                span.spanContext().traceFlags = TraceFlags.NONE;
            }

        }
    }
    if (options.spanProcessors?.length > 0) {
        options.spanProcessors.push(new SpanEnrichingProcessor());
    } else {
        options.spanProcessors = [new SpanEnrichingProcessor()];
    
    }
}