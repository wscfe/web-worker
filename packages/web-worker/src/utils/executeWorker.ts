/* eslint-disable prettier/prettier */
import { ETransferableType } from './status';

interface JOB_RUNNER_OPTIONS {
  fn: () => unknown;
  transferable: ETransferableType;
}

const executeWorker =
  (options: JOB_RUNNER_OPTIONS): ((e: MessageEvent) => Promise<void>) =>
  (e: MessageEvent) => {
    const [userFuncArgs] = e.data as [[]];
    return Promise.resolve(options.fn(...userFuncArgs))
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
