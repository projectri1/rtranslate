module.exports = class Queue {
    _queue = [];

    async _queueInterval() {
        if (queue.length > 0) {
            const element = queue[0];
            await element[0](...element[1]);
            queue.shift();
        }

        this._queueInterval();
    }

    /**
     * Add a method to the queue
     * @param {() => Promise<any>} method The method that gets executed
     * @param {any[]} parameters Parameters that are passed to the method when executed
     */
    add(method, parameters = []) {
        this._queue.push([method, parameters]);
    }
    /**
     * Start the queue
     */
    start() {
        this._queueInterval();
    }

    /**
     * Let the queue wait before executing next method
     * @param {number} milliseconds Milliseconds to wait before next execution
     */
    timeout(milliseconds) {
        this._queue.unshift([
            async () => {
                await new Promise((resolve) => setTimeout(() => resolve(), milliseconds));
            },
            [],
        ]);
    }
};
