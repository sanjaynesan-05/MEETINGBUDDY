const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testEndpoint() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        
        // Load models
        const Meeting = require('./models/Meeting');

        const meeting = await Meeting.findOne();
        if (!meeting) {
            console.log("No meetings found in the database. Please upload one first.");
            process.exit(0);
        }

        console.log(`Found meeting: ${meeting._id} (uploadedBy: ${meeting.uploadedBy})`);

        // Generate token for the user
        const token = jwt.sign({ id: meeting.uploadedBy }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        console.log("Making request to /api/meetings/" + meeting._id + "/analysis");
        
        const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/meetings/${meeting._id}/analysis`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

testEndpoint();
