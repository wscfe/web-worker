# example-b

## Usage

```js
const b = require('example-b');
```

// 第三方worker执行流程

- 1.  首先调用useWorker React Hook，传入初始化的worker执行函数，以及一些初始化参数
- 2.  Hook会返回一个开启worker执行的「callWorker」方法
- 3.  CallWorker方法首先判断是否已经生成worker 实例，若已经生成，则通过worker 实例调用postMessage 并携带动态参数，去触发worker中的message事件；
- 4.  onMessage事件内部的线程逻辑执行完成，会调用postMessage事件并传入执行完成的结果，告知外部执行完成，可以继续做其他事情了；
- 5.  做到链接调用，需要在开启worker执行的时候，保存一个promise实例，在worker收到结束消息的时候，执行resolve；业务侧代码就可以通过then获取执行结果了；

// 是否需要支持一个class实例可以随意通过start方法 开启多个实例

- 设计思路：
- 1.  整个系统使用一个实例维护所有的worker；统一收敛，统一销毁
- 2.  用户通过实例一个 WebWorker class【可选：传入一些初始化参数】
- 3.  内部通过workerList 维护一个执行中的所有worker【执行状态，执行的复杂业务逻辑，以及promise，超时时间等】
- 4.  提供生命周期钩子函数，让用户可以执行过程增加一些定制化的业务逻辑
