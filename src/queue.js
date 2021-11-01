module.exports = class Queue {
    /** The delay in milliseconds between each interval callback */
    intervalDelay = 1;
    _queue = [];

    async _queueInterval() {
        if (this._queue.length > 0) {
            const element = this._queue[0];
            await element[0](...element[1]);
            this._queue.shift();
        }

        setTimeout(() => this._queueInterval(), this.callDelay);
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
