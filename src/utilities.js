function isFunction(fn) {
  return typeof fn === "function";
}

function* generator() { }

function isGenerator(fn) {
  return isFunction(fn) && fn instanceof generator.constructor
}

async function* asyncGenerator() { }

function isAsyncGenerator(fn) {
  return isFunction(fn) && fn instanceof asyncGenerator.constructor
}

const COMPUTE_RESULT_FN_KEY = Symbol();
const COMPUTE_RESULT_FN_VALUE = Symbol();

export { isAsyncGenerator };
export { isGenerator };
export { isFunction };
export { COMPUTE_RESULT_FN_KEY, COMPUTE_RESULT_FN_VALUE };
