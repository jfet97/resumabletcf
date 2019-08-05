[![NPM version](https://img.shields.io/npm/v/resumabletcf.svg)](https://www.npmjs.com/package/resumabletcf) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/jfet97/resumabletcf/blob/master/LICENSE) ![](https://img.shields.io/badge/dependencies-no%20dependencies-%231e88e5%20.svg) ![](https://img.shields.io/node/v/resumabletcf.svg) ![](https://img.shields.io/bundlephobia/minzip/resumabletcf.svg) ![](https://img.shields.io/npm/dt/resumabletcf.svg)
# resumabletcf

A ultra-lightweigh UMD compiled package that helps resuming the flow inside a failed try block.

## install
```sh
$ npm i -S resumabletcf
```

## menu
* [motivation](#motivation)
* [readme](#readme)
* [sync example](#sync-example)
* [async example](#async-example)
* [how does it work](#how-does-it-work)

## motivation
After an error is thrown inside a function, we cannot recover the original code in the point where the error raised up. It's too late because of _stack unwinding_.
This package give to us at least the possibility to try again the failed computation from the client perspective and, if it is the case, replace its value with a fallback one.

## readme
I've written an [exhaustive article](https://dev.to/jfet97/how-to-resume-the-flow-inside-a-failed-try-block-computation-without-algebraic-effects-163k-temp-slug-9699468?preview=9ebdfc5fe84a2ff7efd6c62dae0e50c281c6f3d435c244c51473c791bbae3b0026f24fa974cda75e1599dd5a6e1e4dbb2c695b8eec6fdb089770ba04) about this package.
Please read it to make me happy :D.\
You'll find the background of the package, a more detailed example of its use to connect to some remote API and an example of its limitations.

## sync example
Here you can see how two different sync functions that may throw are handled.\
The former will be replayed at most 5 times in case of failure, and the numeric value `0` is used as a fallback value. The latter will be replayed at most 5 times in case of failure, but no fallback value is used, therefore if we ran out of attempts an exception will be thrown.


```js
const { performSync, computeSync } = require("resumabletcf");

let value = null;

try {
    value = performSync(function*() {
        // computeSync(unitOfWork, howManyTimesToRetry, fallbackValue)
        const res1 = yield computeSync(itMayThrow, 5, 0);
        const res2 = yield computeSync(() => itMayThrowToo(res1), 5);

        return res2 / res1;
    });

} catch(e) {
    console.log(e);
}
```

## async example
There is no much difference between this example and the previous, except that now we are in the async realm.


```js
const { performAsync, computeAsync } = require("resumabletcf");

;(async () => {
    let value = null;

    try {
        value = await performAsync(async function*() {
            // computeAsync(unitOfWork, howManyTimesToRetry, fallbackValue)
            const res1 = yield computeAsync(itMayThrow, 5, 0);
            const res2 = yield computeAsync(() => asyncItMayThrowToo(res1), 5);

            return res2 / res1;
        });

    } catch(e) {
        console.log(e);
    }
})();
```

## how does it work
Both the `performSync` and the `performAsync` functions take a generator, a _sync_ and an _async_ one respectively, and have the task to handle what they yield out. Only a particular type of function that embraces the problematic piece of computation must be yielded out, to then be properly managed by the generator runner, and we can create it thanks to the `compute` helpers.
If the generator reaches the end, the returned value will be given back by the `perform` functions, as a normal value in the `performSync` case or contained in a Promise in the `performAsync` case.

These helpers require __three__ arguments: the unit of work to perform, how many times to retry it in case of failure (default value is __0__) and a fallback value to be used if we ran out of attempts.
If you don't want to let the `perform` runner use a fallback value for a specific computation, preferring to rethrow the exception that has caused the unit of work to fail, simply do not pass the third parameter.
Be aware of the fact that passing `undefined` as the third parameter __is not the same__ as passing only two parameters; this ensures you can use `undefined` as a fallback value.

Three more points to keep in mind:
* `performAsync` always returns a Promise that will be fulfilled only if the async generator reaches the end, otherwise it will be rejected with the exception that causes its interruption as the reason
* the function resulting from calling `computeAsync` always `await` the unit of work you have passed to the helper
* you are not forced to return something from the generators

##
