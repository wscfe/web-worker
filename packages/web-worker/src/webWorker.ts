import {
  ETransferableType,
  EWorkerEndType,
  generateWorkerBlobUrl,
} from './utils';

export interface IWorkerResult<T> {
  type: EWorkerEndType;
  data: T;
}

export interface TWorkerItem<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...fnArgs: any[]) => any = (...fnArgs: any[]) => any,
> {
  /**
   * 当前worker的实例
   */
  worker: Worker | null;

  /**
   * worker内部需要执行的逻辑函数
   */
  workerLogicFunc: T;

  promiseRef: {
    resolve: (result: IWorkerResult<ReturnType<T>>) => void;
    reject: (
      result:
        | IWorkerResult<ReturnType<T>>
        | IWorkerResult<ErrorEvent>
        | IWorkerResult<Error>,
    ) => void;
  } | null;

  /**
   * 处理worker执行超时问题
   */
  timer: number | null;
  timeout?: number;

  blobUrl: string | null;
  remoteDependencies?: string[];
  transferable?: ETransferableType;
}

export class WebWorker {
  static webWorkerInstance: WebWorker | null = null;
  /**
   * 管理不同worker的执行状态，以及运行结果等
   */
  private workerList: TWorkerItem[] = [];

  constructor() {
    if (WebWorker.webWorkerInstance instanceof WebWorker) {
      return WebWorker.webWorkerInstance;
    }
    WebWorker.webWorkerInstance = this;
  }

  // 初始化worker的基本信息
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useWorker<T extends (fnArgs: Parameters<T>[0]) => any>(
    fn: T,
    options?: {
      timeout?: number;
      remoteDependencies?: string[];
      transferable?: ETransferableType;
    },
  ): [
    TWorkerItem<T>,
    (fnArgs: Parameters<T>[0]) => Promise<IWorkerResult<ReturnType<T>>>,
  ] {
    const workerItem: TWorkerItem<T> = {
      worker: null,
      workerLogicFunc: fn,

      promiseRef: null,

      timer: null,
      timeout: options?.timeout,

      blobUrl: null,
      remoteDependencies: options?.remoteDependencies,
      transferable: options?.transferable,
    };
    this.workerList.push(workerItem);

    // Todo: 考虑worker长时间未执行完毕，的promise的pending 问题
    const runWorkerItem = (fnArgs: Parameters<T>[0]) =>
      new Promise<IWorkerResult<ReturnType<T>>>((resolve, reject) => {
        workerItem.promiseRef = {
          resolve,
          reject,
        };

        const blobUrl = generateWorkerBlobUrl({
          fn: workerItem.workerLogicFunc,
          deps: options?.remoteDependencies || [],
          transferable: options?.transferable as ETransferableType,
        });

        workerItem.blobUrl = blobUrl;
        workerItem.worker = new Worker(blobUrl);

        workerItem.worker.onmessage = (event) => {
          workerItem.promiseRef?.resolve({
            type: EWorkerEndType.success,
            data: event.data,
          });
          this.onWorkerEnd(workerItem);
        };
        workerItem.worker.onerror = (error) => {
          workerItem.promiseRef?.reject({
            type: EWorkerEndType.error,
            data: error,
          });
          this.onWorkerEnd(workerItem);
        };

        if (workerItem.timeout) {
          workerItem.timer = window.setTimeout(() => {
            workerItem.promiseRef?.reject({
              type: EWorkerEndType.timeout_expired,
              data: new Error('worker执行超时'),
            });
            this.onWorkerEnd(workerItem);
          }, workerItem.timeout);
        }

        // @ts-ignore
        function converter(key, val) {
          if (
            typeof val === 'function' ||
            (val && val.constructor === RegExp)
          ) {
            return String(val);
          }
          return val;
        }

        // console.log(JSON.stringify(data, converter, 2));

        workerItem.worker.postMessage([
          JSON.parse(JSON.stringify(fnArgs, converter, 2)),
        ]);
      });

    return [workerItem, runWorkerItem];
  }

  // 关闭某一个worker【初始化worker的时候的可以拿到】
  killWorker(workerItem: TWorkerItem): void {
    workerItem.promiseRef?.reject({
      type: EWorkerEndType.timeout_expired,
      data: new Error('主动关闭worker'),
    });
    this.onWorkerEnd(workerItem);
  }

  // 只能关闭全部worker
  killAllWorker(): void {
    this.workerList.forEach((workerItem) => {
      workerItem.promiseRef?.reject({
        type: EWorkerEndType.timeout_expired,
        data: new Error('主动关闭worker'),
      });

      this.onWorkerEnd(workerItem);
    });
  }

  // 监听worker执行结束，执行清空状态动作
  private onWorkerEnd(workerItem: TWorkerItem): void {
    if (workerItem.worker) {
      // 终结worker的执行
      workerItem.worker.terminate();
      // 清空blobUrl资源
      workerItem.blobUrl && URL.revokeObjectURL(workerItem.blobUrl);
      // 清除定时器
      workerItem.timer && window.clearTimeout(workerItem.timer);

      // 删除workerItem对象
      this.workerList = this.workerList.filter((item) => item !== workerItem);
    }
  }
}

export default WebWorker;
