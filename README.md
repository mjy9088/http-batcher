# DEPRECATED! Use [DataLoader](https://www.npmjs.com/package/dataloader) instead

[DataLoader](https://www.npmjs.com/package/dataloader) is more actively maintained, use it instead.

# HTTP Batcher

HTTP Request Batcher for SPA

~~It's for existing project _not using GraphQL_ (maybe Apollo is better)~~

Use [DataLoader](https://www.npmjs.com/package/dataloader) instead

## Install

```bash
npm i http-batcher
```

## Usage

Define type of arguments of request. any form, even `any` is allowed.

```typescript
// for example
interface Request {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: 'string';
  parameter?: string;
}
```

Create Batcher instance with previously defined type, and options

```typescript
const batcher = new Batcher<Request>(options);
```

and queue to the batcher instead of firing HTTP request

```typescript
batcher.queue({
  method: 'GET',
  url: './notice/top/1',
});
```

## Example

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

/*
 * Create Batcher instance
 * See Options for details
 */
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

## Options

- `defaultDelay` - Time to wait for others to be queued, by millisecond. _default 1_
- `minDelay` - Minimum time to wait from the first queued time in the batch. _default 0_
- `maxDelay` - Maximum time to wait from the first queued time. _required_
- `maxCount` - Maximum batch size. _default Infinity, **UNSTABLE**_
- **`process`** - Actual executor for queued tasks. _required_
  - Function accepts **array of** the type of arguments of request and returns Promise for **array** contains each result
  - Some pre/post processing (e.g. remove redundant request by idempotency) can also be performed here
- `preferSingle` - If specified, used instead of `process` if count of requests of the batch is 1. _optional_
  - Function accepts the type of arguments of request and returns Promise for the result
  - Not required~~, but slight reduction in server side load can be expected?~~

## Requirements

Typescript

## License

Code licensed under the MIT License.
