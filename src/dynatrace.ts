import * as core from '@actions/core'
import * as httpm from '@actions/http-client'

export interface Metric {
  metric: string
  value: string
  dimensions: Map<string, string>
}

export interface Event {
  title: string
  text: string
  severity: string
}

function getMetricClient(token: string): httpm.HttpClient {
  return new httpm.HttpClient('dt-http-client', [], {
    headers: {
      'Authorization': 'Api-Token '.concat(token),
      'Content-Type': 'text/plain'
    }
  })
}

export async function sendMetrics(
  url: string,
  token: string,
  metrics: Metric[]
): Promise<void> {
  core.info(`Sending ${metrics.length} metrics`);
  
  const http: httpm.HttpClient = getMetricClient(token);
  let lines = "";

  for (const m of metrics) {
    lines = lines.concat(m.metric);
    m.dimensions.forEach((value: string, key: string) => {
      lines = lines.concat(',').concat(key).concat('="').concat(value).concat('"');
    });
    lines = lines.concat(' ').concat(m.value).concat('\n');
  }
  core.info(lines);
  

  const res: httpm.HttpClientResponse = await http.post(
    url.concat('/api/v2/metrics/ingest'),
    lines
  );

  if (res.message.statusCode === undefined || res.message.statusCode >= 400) {
    throw new Error(`HTTP request failed: ${res.message.statusMessage}`);
  }
  
}