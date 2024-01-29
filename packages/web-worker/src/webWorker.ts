// 第三方worker执行流程
/**
 * 1. 首先调用useWorker React Hook，传入初始化的worker执行函数，以及一些初始化参数
 * 2. Hook会返回一个开启worker执行的「callWorker」方法
 * 3. CallWorker方法首先判断是否已经生成worker 实例，若已经生成，则通过worker 实例调用postMessage 并携带动态参数，去触发worker中的message事件；
 * 4. onMessage事件内部的线程逻辑执行完成，会调用postMessage事件并传入执行完成的结果，告知外部执行完成，可以继续做其他事情了；
 * 5. 做到链接调用，需要在开启worker执行的时候，保存一个promise实例，在worker收到结束消息的时候，执行resolve；业务侧代码就可以通过then获取执行结果了；
 *
 */

// 是否需要支持一个class实例可以随意通过start方法 开启多个实例
/**
 * 设计思路：
 * 1. 整个系统使用一个实例维护所有的worker；统一收敛，统一销毁
 * 2. 用户通过实例一个 WebWorker class【可选：传入一些初始化参数】
 * 3. 内部通过workerList 维护一个执行中的所有worker【执行状态，执行的复杂业务逻辑，以及promise，超时时间等】
 * 4. 提供生命周期钩子函数，让用户可以执行过程增加一些定制化的业务逻辑
 */

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

let webWorkerInstance: WebWorker | null = null;
export class WebWorker {
  /**
   * 记录已经开启的workers
   * 如果同时存在多个worker在执行，如何管理不同worker的执行状态，以及运行结果等
   */
  private workerList: TWorkerItem[] = [];

  constructor() {
    if (webWorkerInstance instanceof WebWorker) {
      return webWorkerInstance;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    webWorkerInstance = this;
  }

  // 初始化worker的基本信息
  useWorker<T extends (...fnArgs: any[]) => any>(
    fn: T,
    options?: {
      timeout?: number;
      remoteDependencies?: string[];
      transferable?: ETransferableType;
    },
  ): [
    TWorkerItem<T>,
    (...fnArgs: Parameters<T>) => Promise<IWorkerResult<ReturnType<T>>>,
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
    const runWorker = (...fnArgs: Parameters<T>) =>
      new Promise<IWorkerResult<ReturnType<T>>>((resolve, reject) => {
        workerItem.promiseRef = {
          resolve,
          reject,
        };

        const blobUrl = generateWorkerBlobUrl(
          workerItem.workerLogicFunc,
          options?.remoteDependencies || [],
          options?.transferable as ETransferableType,
        );

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

        workerItem.worker.postMessage([fnArgs]);
      });

    return [workerItem, runWorker];
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
