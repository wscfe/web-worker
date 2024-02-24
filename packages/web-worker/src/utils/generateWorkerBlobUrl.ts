import executeWorker from './executeWorker';
import remoteDependencyParser from './remoteDependencyParser';
import { ETransferableType } from './status';

const generateWorkerBlobUrl = (
  fn: () => unknown,
  deps: string[],
  transferable: ETransferableType,
) => {
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
