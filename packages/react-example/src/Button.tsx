import type React from 'react';
import styled from 'styled-components';

import { useWebWorker } from './hooks';
import type { IMutableObject } from './type';
import { ConditionValidator } from './utils';

const StyledButton = styled.button`
  text-transform: uppercase;
  background-color: red;
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
      return '校验失败提示消息';
    },
  };
  const conditionValidator = new ConditionValidator<
    IMutableObject[],
    keyof typeof conditions
  >(conditions);

  const { runWorker, loading } = useWebWorker();
  console.log('xxx', loading);

  return (
    <StyledButton type="button" {...props}>
      <>
        {children}
        <div
          onClick={() => {
            runWorker({
              fn: conditionValidator.executeValidator,
              fnParams: {
                conditionKeys: ['checkProjectStatus'],
                conditionSourceData: [{}],
              },
            });
          }}
          onKeyDown={() => console.log('xx')}
          role="button"
          tabIndex={0}
        >
          click
        </div>
      </>
    </StyledButton>
  );
}
