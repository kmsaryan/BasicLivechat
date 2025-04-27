const express = require('express');
const router = express.Router();

// Store a reference to the queue (will be set from the main server)
let chatQueue = null;

// Define the function to set the queue reference
const setQueueReference = (queue) => {
    chatQueue = queue;
};

// Get current queue status (admin endpoint for debugging)
router.get('/queue-status', (req, res) => {
    if (!chatQueue) {
        return res.status(500).json({ error: 'Queue not initialized' });
    }

    const queueSummary = {
        queueState: chatQueue,
        counts: {
            tech: chatQueue.tech?.length || 0,
            billing: chatQueue.billing?.length || 0,
            general: chatQueue.general?.length || 0,
            total: (chatQueue.tech?.length || 0) + 
                   (chatQueue.billing?.length || 0) + 
                   (chatQueue.general?.length || 0)
        }
    };

    res.json(queueSummary);
});

// Export the router and the setQueueReference function
module.exports = {
    router,
    setQueueReference
};
