# HTTP Batcher

> HTTP Request Batcher for SPA

There is better solution, Apollo.

It's for _existing project not using GraphQL_

[TOC]

## Install

```bash
npm i http-batcher
```

## Usage

```typescript
const API_ENDPOINT = './api';
const API_ENDPOINT_BATCH = './api-batch';

/*
 * API Call may includes HTTP method, URL, parameters, ...
 */
type APICall = [key: string, param: any];

function request([key, data]: APICall): Promise<any> {
  return XHR(`${API_ENDPOINT}/${key}`, data);
}

/*
 * To use this library, Batch API needed on the backend
 */
function batchRequest(data: APICall[]): Promise<any[]> {
  return XHR(API_ENDPOINT_BATCH, data);
}

const defaultBatcher = new Batcher<APICall>({
  defaultDelay: 1,
  minDelay: 3,
  maxDelay: 100,
  process: batchRequest,
  preferSingle: request,
});

/*
 * Existing code (maybe) has a common function to call API
 * Change it to use the Batcher!
 * It batches nearly concurrent API calls into one HTTP request
 */
export default function API<Key extends keyof API_DEFINITION>(
  key: Key,
  param: API_DEFINITION[Key]['request'],
  batcher = defaultBatcher,
): Promise<API_DEFINITION[Key]['response']> {
  // Queuing to the batcher instead of firing actual HTTP request
  return batcher.queue<API_DEFINITION[Key]['response']>([key, param]);
}
```

## Requirements

Typescript

## License

Code licensed under the MIT License.
