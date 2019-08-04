
const { performSync, computeSync } = require("../src/index");

describe("sanity check", () => {
  test('should pass', () => {
    expect(true).toBe(true);
  });
});

describe("performSync", () => {

  test('should properly detect a generator as input parameter', () => {
    expect(performSync(function* () { })).not.toThrow();
  });

  test('should properly detect a non generator as input parameter because the argument is a function', () => {
    expect(performSync(() => { })).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is an object', () => {
    expect(performSync({})).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is an array', () => {
    expect(performSync([])).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is a Symbol', () => {
    expect(performSync(Symbol())).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is a number', () => {
    expect(performSync(42)).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is a string', () => {
    expect(performSync("")).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is a boolean', () => {
    expect(performSync(true)).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is null', () => {
    expect(performSync(null)).toThrow(TypeError);
  });

  test('should properly detect a non generator as input parameter because the argument is undefined', () => {
    expect(performSync(undefined)).toThrow(TypeError);
  });

});
