type BatchProcessor<T> = (t: T[]) => Promise<any[]>;
type BatchSingleProcessor<T> = (t: T) => Promise<any>;

interface Options<T> {
  defaultDelay?: number;
  minDelay?: number;
  maxDelay: number;
  maxCount?: number;
  process: BatchProcessor<T>;
  preferSingle?: BatchSingleProcessor<T>;
}

function waitFor(milliseconds: number): [promise: Promise<void>, interrupt: () => void] {
  let interrupt: () => void;
  let promise: Promise<void> = new Promise((resolve, reject) => {
    interrupt = reject;
    setTimeout(() => resolve(), milliseconds);
  });
  return [promise, interrupt];
}

export default class Batcher<T> {
  private pendingRequests?: T[];
  private mainPromise?: Promise<any[]>;
  private interrupt?: () => void;
  private startTime?: number;
  private lastTime?: number;
  defaultDelay: number;
  minDelay: number;
  maxDelay: number;
  maxCount: number;
  process: BatchProcessor<T>;
  preferSingle?: BatchSingleProcessor<T>;

  constructor({
    defaultDelay = 1,
    minDelay = 0,
    maxDelay,
    maxCount = Infinity,
    process,
    preferSingle,
  }: Options<T>) {
    this.defaultDelay = defaultDelay;
    this.minDelay = minDelay;
    this.maxDelay = maxDelay;
    this.maxCount = maxCount;
    this.process = process;
    this.preferSingle = preferSingle;
  }

  public queue<V>(t: T): Promise<V> {
    return (this.pendingRequests ? this.add : this.create)(t);
  }

  private async add<V>(t: T): Promise<V> {
    const resultIndex = this.pendingRequests.length;
    this.pendingRequests.push(t);
    this.lastTime = Date.now();
    this.interrupt();
    return (await this.mainPromise)[resultIndex] as V;
  }

  private async create<V>(t: T): Promise<V> {
    this.pendingRequests = [t];
    this.mainPromise = this.main();
    this.startTime = Date.now();
    return (await this.mainPromise)[0] as V;
  }

  private async main(): Promise<any[]> {
    while (true) {
      if (this.pendingRequests.length >= this.maxCount) {
        break;
      }
      const next = Math.min(
        this.maxDelay - (Date.now() - this.startTime),
        Math.max(
          this.minDelay - (Date.now() - this.startTime),
          this.defaultDelay - (Date.now() - this.lastTime),
        ),
      );
      const [promise, interrupt] = waitFor(next);
      this.interrupt = interrupt;
      try {
        await promise;
      } catch {
        continue;
      }
      break;
    }
    return await this.fire();
  }

  private async fire(): Promise<any[]> {
    if (this.pendingRequests.length === 1 && this.preferSingle) {
      const promise = this.preferSingle(this.pendingRequests[0]);
      this.pendingRequests = undefined;
      return [await promise];
    } else {
      const promise = this.process(this.pendingRequests);
      this.pendingRequests = undefined;
      return await promise;
    }
  }
}
