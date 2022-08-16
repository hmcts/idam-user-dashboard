import * as appInsights from 'applicationinsights';
import config from 'config';
import { Contracts } from 'applicationinsights';
import { obfuscateEmail } from '../../utils/utils';

export class AppInsights {

  enable(): void {
    function preprocessRequestData(envelope: Contracts.EnvelopeTelemetry, contextObjects: any): void {
      // Replace loading of UI assets with a common name so it is earlier to filter them out
      const data = envelope.data.baseData;
      if (data.url.match(/\/assets\/|\.js|\.css/)) {
        data.name = 'GET /**';
      }

      if (contextObjects['http.ServerRequest'].session) {
        appInsights.defaultClient.commonProperties['session_id'] = contextObjects['http.ServerRequest'].sessionID;
      }
      if (contextObjects['http.ServerRequest'].session?.user) {
        appInsights.defaultClient.commonProperties['session_username'] = obfuscateEmail(contextObjects['http.ServerRequest'].session.user.email);
      }
    }

    function preprocessAppInsightData(envelope: Contracts.EnvelopeTelemetry, contextObjects: any): boolean {
      if (envelope.data.baseType === 'RequestData') {
        preprocessRequestData(envelope, contextObjects);
      }
      return true;
    }

    if (config.get('appInsights.instrumentationKey')) {
      appInsights.setup(config.get('appInsights.instrumentationKey'))
        .setSendLiveMetrics(true)
        .start();

      appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = config.get('services.name');
      appInsights.defaultClient.addTelemetryProcessor(preprocessAppInsightData);
    }
  }
}
