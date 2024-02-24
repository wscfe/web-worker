/**
 * @example
 * remoteDepsParser(['http://js.com/1.js', 'http://js.com/2.js']) // importScripts('http://js.com/1.js', 'http://js.com/2.js')
 */
const remoteDependencyParser = (deps: string[]) => {
  if (deps.length === 0) return '';

  const depsString = deps.map((dep) => `'${dep}'`).toString();
  return `importScripts(${depsString})`;
};

export default remoteDependencyParser;
