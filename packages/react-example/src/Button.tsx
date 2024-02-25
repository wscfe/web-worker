import React, { useEffect } from 'react';
import styled from 'styled-components';

import { useWebWorker } from './hooks';
import type { IMutableObject } from './type';
import { executeValidator } from './utils/conditionValidator';

const StyledButton = styled.button`
  text-transform: uppercase;
  /* background-color: red; */
`;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button text
   */
  children: string;
}

/**
 * Button component
 */
export default function Button({
  children,
  ...props
}: ButtonProps): React.ReactElement<ButtonProps> {
  const conditions = {
    checkProjectStatus: (dataSource: IMutableObject[]) => {
      console.log('执行校验逻辑', dataSource);
      for (let i = 0; i < 1000; ++i) {
        console.log('xxx');
      }
      return '校验失败提示消息';
    },
  };

  const { runWorker, loading } = useWebWorker();

  useEffect(() => {
    console.log('loading', loading);
  }, [loading]);

  return (
    <StyledButton type="button" {...props}>
      <>
        {children}
        <div
          style={{ background: 'red' }}
          onClick={async () => {
            const startTime = new Date().getTime();
            const res = await runWorker<
              (params: {
                conditionKeys: (keyof typeof conditions)[];
                conditions: typeof conditions;
                conditionSourceData: IMutableObject[];
              }) => { errorList: string[] }
            >({
              fn: executeValidator as (params: {
                conditionKeys: (keyof typeof conditions)[];
                conditions: typeof conditions;
                conditionSourceData: IMutableObject[];
              }) => { errorList: string[] },
              fnParams: {
                conditionKeys: ['checkProjectStatus'],
                conditions,
                conditionSourceData: [{}],
              },
            });
            console.log(
              '使用web worker非阻塞计算',
              res,
              new Date().getTime() - startTime,
            );
          }}
          onKeyDown={() => console.log('xx')}
          role="button"
          tabIndex={0}
        >
          使用web worker非阻塞计算
        </div>
        <div
          style={{ marginTop: 24, background: 'green' }}
          onClick={async () => {
            const startTime = new Date().getTime();
            const res = executeValidator({
              conditionKeys: ['checkProjectStatus'],
              conditions,
              conditionSourceData: [{}],
            });
            console.log('同步阻塞计算', res, new Date().getTime() - startTime);
          }}
          onKeyDown={() => console.log('xx')}
          role="button"
          tabIndex={0}
        >
          同步阻塞计算
        </div>
      </>
    </StyledButton>
  );
}
