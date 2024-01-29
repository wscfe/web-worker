/* eslint-disable prettier/prettier */
import { ETransferableType } from "./status";

interface JOB_RUNNER_OPTIONS {
  fn: () => any;
  transferable: ETransferableType;
}

/**
 * This function accepts as a parameter a function "userFunc"
 * And as a result returns an anonymous function.
 * This anonymous function, accepts as arguments,
 * the parameters to pass to the function "useArgs" and returns a Promise
 * This function can be used as a wrapper, only inside a Worker
 * because it depends by "postMessage".
 *
 * @param {Function} userFunc {Function} fn the function to run with web worker
 *
 * @returns {Function} returns a function that accepts the parameters
 * to be passed to the "userFunc" function
 */
const executeWorker =
  (options: JOB_RUNNER_OPTIONS): ((e: MessageEvent) => Promise<void>) =>
  (e: MessageEvent) => {
    const [userFuncArgs] = e.data as [[]];
    return Promise.resolve(options.fn(...userFuncArgs))
      .then((result) => {
        const isTransferable = (val: any) =>
          ("ArrayBuffer" in self && val instanceof ArrayBuffer) ||
          ("MessagePort" in self && val instanceof MessagePort) ||
          ("ImageBitmap" in self && val instanceof ImageBitmap) ||
          ("OffscreenCanvas" in self && val instanceof OffscreenCanvas);
        const transferList: any[] =
          options.transferable === "auto" && isTransferable(result)
            ? [result]
            : [];
        // @ts-ignore
        postMessage(["SUCCESS", result], transferList);
      })
      .catch((error) => {
        // @ts-ignore
        postMessage(["ERROR", error]);
      });
  };

export default executeWorker;
