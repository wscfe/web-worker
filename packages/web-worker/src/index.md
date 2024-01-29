1. class形式提供worker基础能力
2. 支持单例模式，避免创建多个instance
3. 不依赖react框架实现，可以在不同环境框架下灵活使用
3. 初始化参数：一个函数（是否支持异步）worker中 执行，内部可以使用postMessage发送消息，超时时间，远端的脚本依赖（比如脚本依赖的lodash）

4. 1. 构造函数，初始化参数即可，保证单利

2. 启动worker

3. 关闭worker【销毁资源】

4. 生成worker

5. 1. class局部状态，是否处于运行中状态，workerStatus记录运行状态，定时器，promiseRef记录resolve，reject方法；

2. 如何在react hook环境中很好的使用我们的worker instance，同时也考虑在其他环境中使用


3. hook需要考虑销毁的问题
    需要考虑传入fn的worker内执行的方法支持异步问题，
    需要考虑存在多个worker的问题，
    需要考虑并发worker的最大数量问题，
    需要考虑worker执行完成之后的链式调用问题，
    需要考虑异常场景的处理问题，
    考虑worker的降级问题（根据计算量级动态判断是否需需要使用worker），
    考虑worker执行状态机设计问题，
    考虑worker API的兼容问题


// 第三方worker执行流程
/**
 * 1. 首先调用useWorker React Hook，传入初始化的worker执行函数，以及一些初始化参数
 * 2. Hook会返回一个开启worker执行的「callWorker」方法
 * 3. CallWorker方法首先判断是否已经生成worker 实例，若已经生成，则通过worker 实例调用postMessage 并携带动态参数，去触发worker中的message事件；
 * 4. onMessage事件内部的线程逻辑执行完成，会调用postMessage事件并传入执行完成的结果，告知外部执行完成，可以继续做其他事情了；
 * 5. 做到链接调用，需要在开启worker执行的时候，保存一个promise实例，在worker收到结束消息的时候，执行resolve；业务侧代码就可以通过then获取执行结果了；
 *
 */

// 是否需要支持一个class实例可以随意通过start方法 开启多个实例
/**
 * 设计思路：
 * 1. 整个系统使用一个实例维护所有的worker；统一收敛，统一销毁
 * 2. 用户通过实例一个 WebWorker class【可选：传入一些初始化参数】
 * 3. 内部通过workerList 维护一个执行中的所有worker【执行状态，执行的复杂业务逻辑，以及promise，超时时间等】
 * 4. 提供生命周期钩子函数，让用户可以执行过程增加一些定制化的业务逻辑
 */