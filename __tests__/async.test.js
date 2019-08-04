
const { performAsync, computeAsync } = require("../src/index");

describe("sanity check", () => {
  test('should pass', () => {
    expect(true).toBe(true);
  });
});

describe("performAsync", () => {

  test('should properly detect an async generator as input parameter', async () => {
    await performAsync(async function* () { }).then(() => { expect(true).toBe(true) }, () => { throw new Error('Should not be here'); });
  });


  test('should properly detect a non async generator as input parameter because the argument is a function', async () => {
    await performAsync(() => { }).then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(TypeError));
  });


  test('should properly detect a non async generator as input parameter because the argument is an object', async () => {
    await performAsync({}).then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(TypeError));
  });


  test('should properly detect a non async generator as input parameter because the argument is an array', async () => {
    await performAsync([]).then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(TypeError));
  });


  test('should properly detect a non async generator as input parameter because the argument is a Symbol', async () => {
    await performAsync(Symbol()).then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(TypeError));
  });


  test('should properly detect a non async generator as input parameter because the argument is a number', async () => {
    await performAsync(42).then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(TypeError));
  });


  test('should properly detect a non async generator as input parameter because the argument is a string', async () => {
    await performAsync("").then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(TypeError));
  });


  test('should properly detect a non async generator as input parameter because the argument is a boolean', async () => {
    await performAsync(true).then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(TypeError));
  });


  test('should properly detect a non async generator as input parameter because the argument is null', async () => {
    await performAsync(null).then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(TypeError));
  });


  test('should properly detect a non async generator as input parameter because the argument is undefined', async () => {
    await performAsync(undefined).then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(TypeError));
  });


  test('should properly detect a yielded value that is not the result of calling \'computeAsync\'', async () => {
    await performAsync(
      async function* () {
        yield {};
      }
    ).then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(Error));
  });

  test('calling \'computeAsync\' without arguments is meaningless but should be allowed', async () => {


    let res = null;
    await performAsync(async function* () {

      res = yield computeAsync();

    });

    expect(res).toBe(void 0);
  });

  test('the first argument for \'computeAsync\' should be a function', async () => {

    await performAsync(async function* () {
      yield computeAsync([]);
    }).then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(TypeError));

  });

  test('the second argument for \'computeAsync\' should be a number', async () => {

    await performAsync(async function* () {
      yield computeAsync(() => { }, []);
    }).then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(TypeError));

  });

  test('the second argument for \'computeAsync\' should not be NaN', async () => {

    await performAsync(async function* () {
      yield computeAsync(() => { }, NaN);
    }).then(() => { throw new Error('Should not be here'); }, err => expect(err).toBeInstanceOf(TypeError));

  });

  test('all the units of work should complete successfully', async () => {

    const mockFn = jest.fn();

    await performAsync(async function* () {
      yield computeAsync(mockFn);
      yield computeAsync(mockFn);
      yield computeAsync(mockFn);
    });

    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('if no value is passed for the \'howManyTimesToRetry\' parameter, the total attempts calling the erroneous function should be one', async () => {

    const errorFn = jest.fn(() => { throw {} });

    try {
      await performAsync(async function* () {
        yield computeAsync(errorFn);
      });
    } catch { }

    // at least the initial attempt
    expect(errorFn).toHaveBeenCalledTimes(1);
  });

  test('if a value is passed for the \'howManyTimesToRetry\' parameter, the total attempts calling the erroneous function should be the value plus one', async () => {

    const errorFn = jest.fn(() => { throw {} });

    try {
      await performAsync(async function* () {
        yield computeAsync(errorFn, 5);
      });
    } catch { }

    // the initial attempt + howManyTimesToRetry times
    expect(errorFn).toHaveBeenCalledTimes(6);
  });

  test('if no error was thrown, the result of the single computation should be insterted back into the generator', async () => {

    const value = {};
    const mockFn = jest.fn(() => value);

    let res = null;
    try {
      await performAsync(async function* () {
        res = yield computeAsync(async () => mockFn());
      });
    } catch { }

    // the initial attempt + howManyTimesToRetry times
    expect(res).toBe(value);
  });

  test('if the recover value was used because of a failed computation, it should be insterted back into the generator', async () => {

    const value = {};
    const errorFn = () => { throw {} };

    let res = null;
    try {
      await performAsync(async function* () {
        res = yield computeAsync(errorFn, 2, value);
      });
    } catch { }

    // the initial attempt + howManyTimesToRetry times
    expect(res).toBe(value);
  });

  test('the catcher function should not be called because no error was thrown', async () => {

    const mockedCatcher = jest.fn();

    try {
      await performAsync(async function* () {
        yield computeAsync(() => { });
      });
    } catch (e) {
      mockedCatcher(e);
    }

    expect(mockedCatcher).not.toHaveBeenCalled();
  });

  test('the catcher function should not be called because the error was handled by \'performAsync\' in a subsequent attempt', async () => {

    const mockedCatcher = jest.fn();
    let alreadyCalled = false;

    try {
      await performAsync(async function* () {
        yield computeAsync(async () => {
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

  test('the catcher function should not be called because the error was handled by \'performAsync\' thanks to the recovery value', async () => {

    const mockedCatcher = jest.fn();

    try {
      await performAsync(async function* () {
        yield computeAsync(() => { throw {} }, 0, void 0);
      });
    } catch (e) {
      mockedCatcher(e);
    }

    expect(mockedCatcher).not.toHaveBeenCalled();
  });

  test('the catcher function should be called because the error was not handled by \'performAsync\' in a subsequent attempt and no recovery value was provided', async () => {

    const mockedCatcher = jest.fn();
    const error = {};

    try {
      await performAsync(async function* () {
        yield computeAsync(async () => { throw error }, 1);
      });
    } catch (e) {
      mockedCatcher(e);
    }

    expect(mockedCatcher).toHaveBeenCalledWith(error);
  });

});
