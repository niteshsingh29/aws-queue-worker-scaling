export const processTask = async (taskData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Worker ${process.pid} completed task: ${taskData}`);
      resolve();
    }, 20000); // Simulated for 20-second
  });
};
