const HotEmitter = (() => {
    const [Emitter, LoadEmitter] = (privateMap => {
        class Emitter {
            constructor() {
                const _private = {};
                privateMap.set(this, _private);

                const receiverSet = new Set();
                const addReceiver = function (receiver) {
                    receiverSet.add(receiver);
                    return () => receiverSet.delete(receiver);
                };

                this.line = new Line(addReceiver);

                Object.assign(_private, {
                    receiverSet,
                    addReceiver
                });
            }
            emit(value) {
                const _private = privateMap.get(this);

                const exList = [];
                for (const receiver of _private.receiverSet) {
                    try {
                        receiver(value);
                    }
                    catch (ex) {
                        exList.push(ex);
                    }
                }
                if (exList.length != 0) {
                    throw exList;
                }
            }
        }

        class LoadEmitter extends Emitter {
            constructor() {
                super();
                const _this = this;
                const _private = privateMap.get(this);

                const super_addReceiver = _private.addReceiver;
                const addReceiver = function (receiver) {
                    const receiverSet = _private.receiverSet;

                    const unloadBefore = receiverSet.size === 0;
                    const remove = super_addReceiver(receiver);
                    if (unloadBefore) {
                        _this.beLoad();
                    }

                    return () => {
                        const loadBefore = receiverSet.size !== 0;
                        remove();
                        const unload = receiverSet.size === 0;
                        if (unload && loadBefore) {
                            _this.beUnload();
                        }
                    };
                };

                this.line = new Line(addReceiver);
                this.beLoad = () => { };
                this.beUnload = () => { };

                Object.assign(_private, {
                    addReceiver
                });
            }
        }

        return [Emitter, LoadEmitter];
    })(new WeakMap());

    class ILine {
        connect() { }
        filter(predicate) {
            return makeExtension(
                this,
                emitB =>
                    value => {
                        if (predicate(value)) {
                            emitB(value);
                        }
                    }
            );
        }
        map(selector) {
            return makeExtension(
                this,
                emitB => value => emitB(selector(value))
            );
        }
        scan(accumulator, seed) {
            return makeExtension(
                this,
                emitB => {
                    var produce = seed;
                    return value => {
                        produce = accumulator(produce, value);
                        emitB(produce);
                    };
                }
            );
        }
    }

    const Line = (privateMap => class Line extends ILine {
        constructor(addReceiver) {
            super();

            const _private = {};
            privateMap.set(this, _private);

            _private.addReceiver = addReceiver;
        }
        connect(receiver) {
            const _private = privateMap.get(this);

            return _private.addReceiver(receiver);
        }
    }
    )(new WeakMap());

    const makeExtension = function (lineA, adapter) {
        const emitterB = new LoadEmitter();
        const receiverAdapter = adapter(emitterB.emit.bind(emitterB));
        var disconnect = () => { };

        emitterB.beLoad = function () {
            disconnect = lineA.connect(receiverAdapter);
        };
        emitterB.beUnload = function () {
            disconnect();
        };

        return emitterB.line;
    };

    const merge = function (...lineArray) {
        const emitterB = new LoadEmitter();
        var disconnectArray = [];
        const emitB = emitterB.emit.bind(emitterB);

        emitterB.beLoad = function () {
            disconnectArray = lineArray.map(line => line.connect(emitB));
        };
        emitterB.beUnload = function () {
            for (var disconnect of disconnectArray) {
                disconnect();
            }
        };

        return emitterB.line;
    };

    const zip = function (selector, ...lineArray) {
        const emitterB = new LoadEmitter();
        const emitMap = new Map();
        const adapter = lineArray.map(
            (_, index) =>
                value => {
                    emitMap.set(index, value);
                    if (emitMap.size === lineArray.size) {
                        const emitArray = new Array(lineArray.size)
                            .fill(0)
                            .map((_, index) => emitMap.get(index));
                        emitterB.emit(selector(...emitArray));
                        emitMap.clear();
                    }
                }
        );
        var disconnectArray = [];

        emitterB.beLoad = function () {
            disconnectArray = lineArray.map((line, index) => line.connect(adapter[index]));
        };
        emitterB.beUnload = function () {
            for (var disconnect of disconnectArray) {
                disconnect();
            }
            emitMap.clear();
        };

        return emitterB.line;
    };

    const getEmitter = function () {
        var emitter = new Emitter();
        return [emitter.emit.bind(emitter), emitter.line];
    };

    return {
        makeExtension,
        merge,
        zip,
        getEmitter,
    };
})();