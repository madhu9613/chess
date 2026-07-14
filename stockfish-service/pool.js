import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkerPool {
    // due to run memory out i am using  1 worker lets see in docker i have 2;
    constructor(size = 1) {
        this.size = size;
        this.workers = [];
        this.taskQueue = [];
        this.taskIdCounter = 0;
        this.pending = new Map(); // taskId -> { resolve, reject }
        this.init();
    }

    init() {
        for (let i = 0; i < this.size; i++) {
            const worker = fork(path.join(__dirname, 'worker.js'));
            worker.on('message', (msg) => this.handleWorkerMessage(worker, msg));
            worker.on('exit', (code) => {
                console.error(`Worker ${worker.pid} exited (code ${code}). Restarting...`);
                this.restartWorker(worker);
            });
            this.workers.push({ worker, busy: false });
        }
    }

    restartWorker(oldWorker) {
        const index = this.workers.findIndex((w) => w.worker === oldWorker);
        if (index === -1) return;
        this.workers.splice(index, 1);
        const newWorker = fork(path.join(__dirname, 'worker.js'));
        newWorker.on('message', (msg) => this.handleWorkerMessage(newWorker, msg));
        newWorker.on('exit', (code) => {
            console.error(`Worker ${newWorker.pid} exited (code ${code}). Restarting...`);
            this.restartWorker(newWorker);
        });
        this.workers.push({ worker: newWorker, busy: false });
        this.processQueue();
    }

    handleWorkerMessage(worker, msg) {
        const { id, result, error } = msg;
        const pending = this.pending.get(id);
        if (pending) {
            this.pending.delete(id);
            if (error) pending.reject(new Error(error));
            else pending.resolve(result);
            // Mark worker free
            const entry = this.workers.find((w) => w.worker === worker);
            if (entry) {
                entry.busy = false;
                this.processQueue();
            }
        }
    }

    processQueue() {
        if (this.taskQueue.length === 0) return;
        const freeEntry = this.workers.find((w) => !w.busy);
        if (!freeEntry) return;
        const task = this.taskQueue.shift();
        this.executeTask(freeEntry, task);
    }

    executeTask(workerEntry, task) {
        const { resolve, reject, fen, level, multiPV, mode } = task;
        const id = this.taskIdCounter++;
        this.pending.set(id, { resolve, reject });
        workerEntry.busy = true;
        workerEntry.worker.send({ id, fen, level, multiPV, mode });
    }

    execute({ fen, level = 'medium', multiPV = 1, mode = 'move' }) {
        return new Promise((resolve, reject) => {
            const task = { fen, level, multiPV, mode, resolve, reject };
            const freeEntry = this.workers.find((w) => !w.busy);
            if (freeEntry) {
                this.executeTask(freeEntry, task);
            } else {
                this.taskQueue.push(task);
            }
        });
    }
    getStatus() {
        return {
            total: this.workers.length,
            busy: this.workers.filter(w => w.busy).length,
            available: this.workers.filter(w => !w.busy).length
        };
    }

    close() {
        this.workers.forEach((entry) => entry.worker.kill());
    }
}



export default WorkerPool;