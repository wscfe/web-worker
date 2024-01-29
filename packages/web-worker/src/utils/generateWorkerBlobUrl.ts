import executeWorker from './executeWorker';
import remoteDependencyParser from './remoteDependencyParser';

import { ETransferableType } from './status';

/**
 * Converts the "fn" function into the syntax needed to be executed within a web worker
 *
 * @param {Function} fn the function to run with web worker
 * @param {Array.<String>} deps array of strings, imported into the worker through "importScripts"
 *
 * @returns {String} a blob url, containing the code of "fn" as a string
 *
 * @example
 * createWorkerBlobUrl((a,b) => a+b, [])
 * .then(postMessage(['SUCCESS', result]))
 * .catch(postMessage(['ERROR', error])"
 */
const generateWorkerBlobUrl = (fn: () => any, deps: string[], transferable: ETransferableType) => {
  const blobCode = `
    ${remoteDependencyParser(deps)};
    onmessage=(${executeWorker})({
      fn: (${fn}),
      transferable: '${transferable}'
    })
  `;
  const blob = new Blob([blobCode], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  return url;
};

export default generateWorkerBlobUrl;
