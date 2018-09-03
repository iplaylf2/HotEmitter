var HotEmit = (() => {
    var GetEmitter = function () {
        var actionSet = new Set();
        var emit = function (value) {
            for (var action of actionSet) {
                action(value);
            }
        };

        return [emit, new Line(actionSet)];
    };

    var LineExtensionMethod = {
        filter: function (predicate) {
            var lineA = this;
            return new ExtensionLine(lineA, emit =>
                value => {
                    if (predicate(value)) {
                        emit(value);
                    }
                });
        },
        map: function (func) {
            var lineA = this;
            return new ExtensionLine(lineA, emit =>
                value => {
                    emit(func(value));
                });
        },
        scan: function (accumulator, seed) {
            var lineA = this;
            return new ExtensionLine(lineA, emit => {
                var produce = seed;
                return value => {
                    produce = accumulator(produce, value);
                    emit(produce);
                };
            });
        }
    };

    var Line = (() => {
        var Line = function (actionSet) {
            var disconnectMap = new Map();
            var connect = function (action) {
                if (!disconnectMap.has(action)) {
                    actionSet.add(action);
                    disconnectMap.set(action, () => {
                        if (disconnectMap.delete(action)) {
                            actionSet.delete(action);
                        }
                    });
                }
                return disconnectMap.get(action);
            };

            Object.assign(this, {
                connect
            });
        };

        Line.prototype = LineExtensionMethod;

        return Line;
    })();

    var ExtensionLine = (() => {
        var ExtensionLine = function (lineA, pipe) {
            var [emit, lineB] = GetEmitter();
            var disconnectA;
            var disconnectMap = new Map();
            var connect = function (action) {
                if (!disconnectMap.has(action)) {
                    if (disconnectMap.size === 0) {
                        disconnectA = lineA.connect(pipe(emit));
                    }
                    var disconnectB = lineB.connect(action);
                    disconnectMap.set(action, () => {
                        if (disconnectMap.delete(action)) {
                            disconnectB();
                            if (disconnectMap.size === 0) {
                                disconnectA();
                                disconnectA = undefined;
                            }
                        }
                    });
                }
                return disconnectMap.get(action);
            };

            Object.assign(this, {
                connect
            });
        };

        ExtensionLine.prototype = LineExtensionMethod;

        return ExtensionLine;
    })();

    var ConcourseLine = (() => {
        var ConcourseLine = function (lineArray, pipe) {
            var [emit, concourseLine] = GetEmitter();
            var disconnectArray;
            var disconnectMap = new Map();
            var connect = function (action) {
                if (!disconnectMap.has(action)) {
                    if (disconnectMap.size === 0) {
                        disconnectArray = [];
                        for (var line of lineArray) {
                            disconnectArray.push(line.connect(pipe(emit, line)));
                        }
                    }
                    var disconnectConcourse = concourseLine.connect(action);
                    disconnectMap.set(action, () => {
                        if (disconnectMap.delete(action)) {
                            disconnectConcourse();
                            if (disconnectMap.size === 0) {
                                for (var disconnect of disconnectArray) {
                                    disconnect();
                                };
                                disconnectArray = undefined;
                            }
                        }
                    });
                }
                return disconnectMap.get(action);
            };

            Object.assign(this, {
                connect
            });
        };

        ConcourseLine.prototype = LineExtensionMethod;

        return ConcourseLine;
    })();

    var Merge = function (lineArray) {
        return new ConcourseLine(lineArray, emit => emit);
    };

    var Zip = function (resultSelector, ...lineArray) {
        var lineMap = new Map();
        for (var [index, item] of lineArray.entries()) {
            lineMap.set(item, index);
        }
        var emitMap = new Map();
        return new ConcourseLine(lineArray, (emit, line) => {
            if (emitMap.size !== 0) {
                emitMap = new Map();
            }
            return value => {
                emitMap.set(line, value);
                if (emitMap.size === lineMap.size) {
                    var arguement = new Array(lineMap.size);
                    for (var [l, v] of emitMap) {
                        arguement[lineMap.get(l)] = v;
                    }
                    emitMap = new Map();
                    emit(resultSelector(...arguement));
                }
            };
        });
    };

    return { GetEmitter, LineExtensionMethod, Merge, Zip };
})();