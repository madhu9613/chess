import { Queue, Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

const QUEUE_NAME = 'notifications';

const queueConnection = createRedisConnection();

export const notificationQueue = new Queue(QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
        removeOnComplete: 500,
        removeOnFail: 500,
    },
});

export const enqueueNotification = async (type, payload) => {
    return notificationQueue.add(type, { type, payload });
};

let notificationWorkerStarted = false;

export const startNotificationWorker = (io) => {
    if (notificationWorkerStarted) return;
    notificationWorkerStarted = true;

    const workerConnection = createRedisConnection();
    const worker = new Worker(
        QUEUE_NAME,
        async (job) => {
            const { type, payload } = job.data || {};
            if (!type || !payload) return;

            if (payload.socketId) {
                io.to(payload.socketId).emit('notification', {
                    type,
                    ...payload,
                });
            }

            console.log(`[NotificationQueue] ${type}`, {
                roomCode: payload.roomCode,
                userId: payload.userId,
                socketId: payload.socketId,
            });
        },
        { connection: workerConnection }
    );

    worker.on('failed', (job, error) => {
        console.error('[NotificationQueue] job failed', {
            jobId: job?.id,
            error: error?.message,
        });
    });
};
