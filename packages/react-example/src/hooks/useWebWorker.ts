import type { TWorkerItem } from '@worker/web-worker/src/index';
import { WebWorker } from '@worker/web-worker/src/index';
import { useCallback, useEffect, useRef, useState } from 'react';

const useWebWorker = () => {
  const [loading, setLoading] = useState(false);
  const workerItemRef = useRef<TWorkerItem | null>(null);
  const webWorkerInstanceRef = useRef<WebWorker | null>(null);

  const runWorker = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async <T extends (...fnArgs: any[]) => any>(params: {
      fn: T;
      fnParams: Parameters<T>[0];
    }) => {
      try {
        const { fn, fnParams } = params || {};
        const webWorker = new WebWorker();
        const [workerItem, runWorkerItem] = webWorker.useWorker<T>(fn);

        workerItemRef.current = workerItem;
        webWorkerInstanceRef.current = webWorker;

        setLoading(true);
        const res = await runWorkerItem(fnParams);
        setLoading(false);
        return res;
      } catch (err) {
        console.log('err', err);
        setLoading(false);
      }
    },
    [],
  );

  // 组件销毁需要清空当前worker的资源，执行完成之后也会自动执行
  // 避免出现未执行完成时组件就被卸载，导致 worker没有被销毁的场景；
  useEffect(
    () => () => {
      if (workerItemRef.current && webWorkerInstanceRef.current) {
        webWorkerInstanceRef.current.killWorker(workerItemRef.current);
      }
    },
    [],
  );

  return {
    loading,
    runWorker,
  };
};

export default useWebWorker;
