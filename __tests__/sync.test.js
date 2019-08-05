
const { performSync, computeSync } = require("../src/index");

describe("sanity check", () => {
  test('should pass', () => {
    expect(true).toBe(true);
  });
});

describe("performSync", () => {

  test('should properly detect a generator as input parameter', () => {
    expect(() => { performSync(function* () { }) }).not.toThrow();
  });

  test('should properly detect a non generator as input parameter because the argument is a function', () => {
    expect(() => { performSync(() => { }) }).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is an object', () => {
    expect(() => { performSync({}) }).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is an array', () => {
    expect(() => { performSync([]) }).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is a Symbol', () => {
    expect(() => { performSync(Symbol()) }).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is a number', () => {
    expect(() => { performSync(42) }).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is a string', () => {
    expect(() => { performSync("") }).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is a boolean', () => {
    expect(() => { performSync(true) }).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is null', () => {
    expect(() => { performSync(null) }).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is undefined', () => {
    expect(() => { performSync(undefined) }).toThrow(TypeError);
  });

  test('should properly detect a yielded value that is not the result of calling \'computeSync\'', () => {
    expect(
      () => {
        performSync(
          function* () {
            yield {};
          }
        )
      }).toThrow(Error);
  });

  test('calling \'computeSYnc\' without arguments is meaningless but should be allowed', () => {


    let res = null;
    performSync(function* () {

      res = yield computeSync();

    });

    expect(res).toBe(void 0);
  });

  test('the first argument for \'computeSYnc\' should be a function', () => {

    const action = () => performSync(function* () {
      yield computeSync([]);
    });

    expect(action).toThrow(TypeError);
  });

  test('the second argument for \'computeSYnc\' should be a number', () => {

    const action = () => performSync(function* () {
      yield computeSync(() => { }, []);
    });

    expect(action).toThrow(TypeError);
  });

  test('the second argument for \'computeSYnc\' should not be NaN', () => {

    const action = () => performSync(function* () {
      yield computeSync(() => { }, NaN);
    });

    expect(action).toThrow(TypeError);
  });

  test('all the units of work should complete successfully', () => {

    const mockFn = jest.fn();

    performSync(function* () {
      yield computeSync(mockFn);
      yield computeSync(mockFn);
      yield computeSync(mockFn);
    });

    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('the returned value from the generator should be returned by \'performSync\'', () => {

    const returnValue = {};

    const res = performSync(function* () {
      return returnValue;
    });

    expect(res).toBe(returnValue);
  });

  test('if no value is passed for the \'howManyTimesToRetry\' parameter, the total attempts calling the erroneous function should be one', () => {

    const errorFn = jest.fn(() => { throw {} });

    try {
      performSync(function* () {
        yield computeSync(errorFn);
      });
    } catch { }

    // at least the initial attempt
    expect(errorFn).toHaveBeenCalledTimes(1);
  });

  test('if a value is passed for the \'howManyTimesToRetry\' parameter, the total attempts calling the erroneous function should be the value plus one', () => {

    const errorFn = jest.fn(() => { throw {} });

    try {
      performSync(function* () {
        yield computeSync(errorFn, 5);
      });
    } catch { }

    // the initial attempt + howManyTimesToRetry times
    expect(errorFn).toHaveBeenCalledTimes(6);
  });

  test('if no error was thrown, the result of the single computation should be insterted back into the generator', () => {

    const value = {};
    const mockFn = jest.fn(() => value);

    let res = null;
    try {
      performSync(function* () {
        res = yield computeSync(mockFn);
      });
    } catch { }

    // the initial attempt + howManyTimesToRetry times
    expect(res).toBe(value);
  });

  test('if the recover value was used because of a failed computation, it should be insterted back into the generator', () => {

    const value = {};
    const errorFn = () => { throw {} };

    let res = null;
    try {
      performSync(function* () {
        res = yield computeSync(errorFn, 2, value);
      });
    } catch { }

    // the initial attempt + howManyTimesToRetry times
    expect(res).toBe(value);
  });

  test('the catcher function should not be called because no error was thrown', () => {

    const mockedCatcher = jest.fn();

    try {
      performSync(function* () {
        yield computeSync(() => { });
      });
    } catch (e) {
      mockedCatcher(e);
    }

    expect(mockedCatcher).not.toHaveBeenCalled();
  });

  test('the catcher function should not be called because the error was handled by \'performSync\' in a subsequent attempt', () => {

    const mockedCatcher = jest.fn();
    let alreadyCalled = false;

    try {
      performSync(function* () {
        yield computeSync(() => {
          if (!alreadyCalled) {
            alreadyCalled = true;
            throw {};
          }
        }, 1);
      });
    } catch (e) {
      mockedCatcher(e);
    }

    expect(mockedCatcher).not.toHaveBeenCalled();
  });

  test('the catcher function should not be called because the error was handled by \'performSync\' thanks to the recovery value', () => {

    const mockedCatcher = jest.fn();

    try {
      performSync(function* () {
        yield computeSync(() => { throw {} }, 0, void 0);
      });
    } catch (e) {
      mockedCatcher(e);
    }

    expect(mockedCatcher).not.toHaveBeenCalled();
  });

  test('the catcher function should be called because the error was not handled by \'performSync\' in a subsequent attempt and no recovery value was provided', () => {

    const mockedCatcher = jest.fn();
    const error = {};

    try {
      performSync(function* () {
        yield computeSync(() => { throw error }, 1);
      });
    } catch (e) {
      mockedCatcher(e);
    }

    expect(mockedCatcher).toHaveBeenCalledWith(error);
  });

});
