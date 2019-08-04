import { isFunction, isGenerator, COMPUTE_RESULT_FN_KEY, COMPUTE_RESULT_FN_VALUE } from "../utilities";

/**
 *
 *
 * @param {Generator} The generator that contains the try block computation
 */
function performSync(generator) {

  if (!isGenerator(generator)) {
    throw TypeError(`${generator} is not a generator function`);
  }

  /** the iterator produced by the generator */
  const it = generator();

  /** it will store the IteratorResult */
  let next;
  /** it will store the result of calling the almostSafeComputation function contained into the IteratorResult */
  let value;

  do {
    /** we feed the generator with the last value
		 *  during the first iteration, the value will be undefined but generators do ignore the first inserted value
     *
     *  if the generator itself throws an error I'm not going to do anything because 'performSync' helps only with failed computation wrapped
     *  with the help of 'computedSync'
     */
    next = it.next(value);



    let almostSafeComputation = next.value;

    if (!(COMPUTE_RESULT_FN_KEY in almostSafeComputation)) {
      throw Error("Do not yield entities not created with the 'computeSync' function")
    }

    /** it's almost safe because without a recovery value I have to throw inside it in case of failed attempts */
    value = almostSafeComputation();

  } while (!next.done)



}

function computeSync(taskToExecuteThatMayThrow = () => { }, howManyTimesToRetry = 0, recoveryValue = void 0) {

  if (!isFunction(taskToExecuteThatMayThrow)) {
    throw TypeError(`${taskToExecuteThatMayThrow} is not a function`);
  }

  if (!(typeof howManyTimesToRetry === "number") || Number.isNaN(howManyTimesToRetry)) {
    throw new TypeError(`${howManyTimesToRetry} is not a valid number for the 'howManyTimesToRetry' parameter`);
  }

  const argumentsLength = arguments.length;

  let shouldBeRecoveredAfterMultipleFailures = false;

  /** computed was called without arguments (non-sensical) */
  /** computed was called only with the task to execute (non-sensical because it will be tried only one time so what's the point of using 'computeSync'?) */
  /** computed was called with both the task to execute and the times we have to retry it in case of failure (ok) */
  if (argumentsLength <= 2) { }

  /** computed was called non only withe the task to execute and the times we have to retry it in case of failure, but with the recovery value as well (perfect) */
  if (argumentsLength >= 3) {
    /** only if the third argument is expressly specified (also with the undefined value) we'll use it to recover from possible multiple failures */
    shouldBeRecoveredAfterMultipleFailures = true;
  }

  const functionToBeReturned = function almostSafeComputation() {

    let resultValue = null;
    let error = null;

    /** at least one time */
    do {

      try {
        resultValue = taskToExecuteThatMayThrow();

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

  /** it marks unequivocally functons created by the 'computeSync' function */
  functionToBeReturned[COMPUTE_RESULT_FN_KEY] = COMPUTE_RESULT_FN_VALUE;

  return functionToBeReturned;
}

export { performSync, computeSync };
