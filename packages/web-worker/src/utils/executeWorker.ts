/* eslint-disable prettier/prettier */
import { ETransferableType } from './status';

interface JOB_RUNNER_OPTIONS {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (fnArgs: any) => unknown;
  transferable: ETransferableType;
}

const executeWorker =
  (options: JOB_RUNNER_OPTIONS): ((e: MessageEvent) => Promise<void>) =>
  (e: MessageEvent) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Promise.resolve(options.fn(e.data[0] || {}))
      .then((result) => {
        const isTransferable = (val: unknown) =>
          ('ArrayBuffer' in self && val instanceof ArrayBuffer) ||
          ('MessagePort' in self && val instanceof MessagePort) ||
          ('ImageBitmap' in self && val instanceof ImageBitmap) ||
          ('OffscreenCanvas' in self && val instanceof OffscreenCanvas);
        const transferList: unknown[] =
          options.transferable === 'auto' && isTransferable(result)
            ? [result]
            : [];
        // @ts-ignore
        postMessage(['SUCCESS', result], transferList);
      })
      .catch((error) => {
        // @ts-ignore
        postMessage(['ERROR', error]);
      });
  };

export default executeWorker;
