const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// Store images data in a JSON file
const IMAGES_FILE = path.join(__dirname, 'data', 'images.json');
// Add new file for audio data
const AUDIO_FILE = path.join(__dirname, 'data', 'audio.json');

// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(IMAGES_FILE, JSON.stringify([]), 'utf8');
        await fs.writeFile(AUDIO_FILE, JSON.stringify([]), 'utf8');
    }
}

// API to get all images
app.get('/api/images', async (req, res) => {
    try {
        const data = await fs.readFile(IMAGES_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading images:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

// API to add new image
app.post('/api/images', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        // Read current images
        const data = await fs.readFile(IMAGES_FILE, 'utf8');
        const images = JSON.parse(data);

        // Add new image
        images.push({
            id: Date.now().toString(),
            url,
            createdAt: new Date().toISOString()
        });

        // Save updated images
        await fs.writeFile(IMAGES_FILE, JSON.stringify(images), 'utf8');

        res.status(201).json({ success: true, message: 'Image added successfully' });
    } catch (error) {
        console.error('Error adding image:', error);
        res.status(500).json({ error: 'Failed to add image' });
    }
});

// API to delete an image
app.delete('/api/images/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Read current images
        const data = await fs.readFile(IMAGES_FILE, 'utf8');
        let images = JSON.parse(data);

        // Filter out the image to delete
        images = images.filter(image => image.id !== id);

        // Save updated images
        await fs.writeFile(IMAGES_FILE, JSON.stringify(images), 'utf8');

        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

// NEW API: Get all audio tracks
app.get('/api/audio', async (req, res) => {
    try {
        const data = await fs.readFile(AUDIO_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading audio tracks:', error);
        res.status(500).json({ error: 'Failed to fetch audio tracks' });
    }
});

// NEW API: Add new audio track
app.post('/api/audio', async (req, res) => {
    try {
        const { url, title, artist } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Audio URL is required' });
        }

        // Read current audio tracks
        const data = await fs.readFile(AUDIO_FILE, 'utf8');
        const audioTracks = JSON.parse(data);

        // Add new audio track
        audioTracks.push({
            id: Date.now().toString(),
            url,
            title: title || 'Unknown Title',
            artist: artist || 'Unknown Artist',
            createdAt: new Date().toISOString()
        });

        // Save updated audio tracks
        await fs.writeFile(AUDIO_FILE, JSON.stringify(audioTracks), 'utf8');

        res.status(201).json({ success: true, message: 'Audio track added successfully' });
    } catch (error) {
        console.error('Error adding audio track:', error);
        res.status(500).json({ error: 'Failed to add audio track' });
    }
});

// NEW API: Delete an audio track
app.delete('/api/audio/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Read current audio tracks
        const data = await fs.readFile(AUDIO_FILE, 'utf8');
        let audioTracks = JSON.parse(data);

        // Filter out the audio track to delete
        audioTracks = audioTracks.filter(track => track.id !== id);

        // Save updated audio tracks
        await fs.writeFile(AUDIO_FILE, JSON.stringify(audioTracks), 'utf8');

        res.json({ success: true, message: 'Audio track deleted successfully' });
    } catch (error) {
        console.error('Error deleting audio track:', error);
        res.status(500).json({ error: 'Failed to delete audio track' });
    }
});

// Serve the frontend for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
async function startServer() {
    await ensureDataDir();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Visit http://localhost:${PORT} to view your application`);
    });
}

startServer().catch(console.error);
