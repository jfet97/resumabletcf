import { isFunction, isAsyncGenerator, COMPUTE_RESULT_FN_KEY, COMPUTE_RESULT_FN_VALUE } from "../utilities";

/**
 *
 *
 * @param {Generator} The asyncGenerator that contains the try block computation
 */
async function performAsync(asyncGenerator) {

  if (!isAsyncGenerator(asyncGenerator)) {
    throw TypeError(`${asyncGenerator} is not an asyncGenerator function`);
  }

  /** the iterator produced by the asyncGenerator */
  const ait = asyncGenerator();

  /** it will store the AsyncIteratorResult */
  let next;
  /** it will store the result of calling the almostSafeComputation function contained into the AsyncIteratorResult */
  let value;


  /** start the iteration */
  next = await ait.next(value);

  while (!next.done) { /** don't care about the returned value from the asyncGenerator */

    /**
     * we feed the asyncGenerator with the last value
     *  during the first iteration, the value will be undefined but generators do ignore the first inserted value
     *
     *  if the asyncGenerator itself throws an error I'm not going to do anything because 'performAsync' helps only with failed computation wrapped
     *  with the help of 'computedAsync'
     */

    let almostSafeComputation = next.value;

    if (!(almostSafeComputation[COMPUTE_RESULT_FN_KEY])) {
      throw Error("Do not yield entities not created with the 'computeAsync' function")
    }

    /** it's almost safe because without a recovery value I have to throw inside it in case of failed attempts */
    value = await almostSafeComputation();

    /** continue the iteration */
    next = await ait.next(value);
  }

  /** return the value returned by the async generator */
  return next.value;
  
}
/**
 *
 *
 * @param {function} [taskToExecuteThatMayThrow=() => { }] The task to execute that may throw an error
 * @param {number} [howManyTimesToRetry=0]
 * @param {any} [recoveryValue=void 0]
 * @returns
 */
function computeAsync(taskToExecuteThatMayThrow = () => { }, howManyTimesToRetry = 0, recoveryValue = void 0) {

  if (!isFunction(taskToExecuteThatMayThrow)) {
    throw TypeError(`${taskToExecuteThatMayThrow} is not a function`);
  }

  if (!(typeof howManyTimesToRetry === "number") || Number.isNaN(howManyTimesToRetry)) {
    throw new TypeError(`${howManyTimesToRetry} is not a valid number for the 'howManyTimesToRetry' parameter`);
  }

  const argumentsLength = arguments.length;

  let shouldBeRecoveredAfterMultipleFailures = false;

  /** computed was called without arguments (non-sensical) */
  /** computed was called only with the task to execute (non-sensical because it will be tried only one time so what's the point of using 'computeAsync'?) */
  /** computed was called with both the task to execute and the times we have to retry it in case of failure (ok) */
  if (argumentsLength <= 2) { }

  /** computed was called non only withe the task to execute and the times we have to retry it in case of failure, but with the recovery value as well (perfect) */
  if (argumentsLength >= 3) {
    /** only if the third argument is expressly specified (also with the undefined value) we'll use it to recover from possible multiple failures */
    shouldBeRecoveredAfterMultipleFailures = true;
  }

  const functionToBeReturned = async function almostSafeComputation() {

    let resultValue = null;
    let error = null;

    /** at least one time */
    do {

      try {
        resultValue = await taskToExecuteThatMayThrow();

        /** if the task was completed successfully, reset the error and stop the cycle */
        error = null;
        break;
      } catch (e) {

        /** store the last thrown error */
        error = e;
      }

    } while (howManyTimesToRetry--);

    /** it means all attempts failed miserely */
    if (error) {
      /** if a 'recoveryValue' argument was taken we'll use it as a replacement for the failed computations */
      if (shouldBeRecoveredAfterMultipleFailures) {
        resultValue = recoveryValue;
      } else {
        /** otherwise we error out */
        throw error;
      }
    }

    return resultValue;
  }

  /** it marks unequivocally functons created by the 'computeAsync' function */
  functionToBeReturned[COMPUTE_RESULT_FN_KEY] = COMPUTE_RESULT_FN_VALUE;

  return functionToBeReturned;
}

export { performAsync, computeAsync };
