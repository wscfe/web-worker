import executeWorker from './executeWorker';
import remoteDependencyParser from './remoteDependencyParser';
import { ETransferableType } from './status';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateWorkerBlobUrl = <T>(params: {
  fn: T;
  deps: string[];
  transferable: ETransferableType;
}) => {
  const { fn, deps, transferable } = params;
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
