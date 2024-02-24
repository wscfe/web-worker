import type { IMutableObject } from '../type';

class ConditionValidator<T = IMutableObject, K extends string = string> {
  static conditionValidatorInstance: typeof ConditionValidator.prototype;

  // 记录自定义的校验方法
  private conditions: {
    [index in K]?: (params: T) => string | React.ReactNode;
  } = {};

  constructor(initialConditions: {
    [index in K]?: (params: T) => string | React.ReactNode;
  }) {
    if (ConditionValidator.conditionValidatorInstance) {
      return ConditionValidator.conditionValidatorInstance;
    }

    this.conditions = initialConditions;
    ConditionValidator.conditionValidatorInstance = this;
  }

  executeValidator(params: { conditionKeys: K[]; conditionSourceData: T }): {
    errorList: (string | React.ReactNode)[];
  } {
    const { conditionKeys, conditionSourceData } = params || {};
    const errorList: (string | React.ReactNode)[] = [];
    if (!Object.keys(this.conditions)?.length) return { errorList };

    if (!conditionKeys?.length) return { errorList };

    conditionKeys.forEach((conditionKey) => {
      if (typeof this.conditions[conditionKey] !== 'function') return;
      try {
        const errorMsg = this.conditions[conditionKey]?.(conditionSourceData);
        if (!errorMsg) return;

        errorList.push(errorMsg);
      } catch (err) {
        // todo：补充自定义日志上报
        // console.log(err);
      }
    });

    return { errorList };
  }
}

export default ConditionValidator;
