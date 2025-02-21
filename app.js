import express from 'express';
import AWS from 'aws-sdk';
import cluster from 'cluster';
import os from 'os';

const PORT = 3000;
const numWorkers = os.cpus().length;

AWS.config.update({ region: 'us-east-1' });
const sns = new AWS.SNS();

if (cluster.isMaster) {
    console.log(`Master process ${process.pid} is running`);
    
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        console.log(`Worker ${worker.process.pid} exited. Spawning a new one...`);
        cluster.fork();
    });

    const app = express();
    app.use(express.json());

    // HTTP endpoint to receive SNS notifications and process tasks immediately
    app.get('/sns-handler', async (req, res) => {
        try {
            const message = req?.body?.Message || '';
            console.log(`Received SNS message: ${message}`);
            
            // Send task to a worker
            const worker = cluster.workers[Math.floor(Math.random() * numWorkers) + 1];
            if (worker) worker.send(message);
            res.status(200).send('Task completed by to worker');

            process.on('complete', () => {

            })
            
        } catch (error) {
            console.error('Error processing task:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
} else {
    console.log(`Worker ${process.pid} started`);
    
    async function processTask(taskData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Worker ${process.pid} completed task: ${taskData}`);
                resolve();
            }, 20000); // Simulate 20-second task
        });
    }
    
    process.on('message', async (taskData) => {
        await processTask(taskData);

        process.send({});
    });
}
