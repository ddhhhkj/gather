const express = require('express');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

// Set up the database with a default 'submissions' array
db.defaults({ submissions: [] }).write();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files from the root directory

app.get('/api/submissions', (req, res) => {
    const submissions = db.get('submissions').value();
    res.json(submissions);
});

app.post('/api/submissions', (req, res) => {
    const { name, dates } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).send({ message: 'Name is required.' });
    }
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
        return res.status(400).send({ message: 'At least one date must be selected.' });
    }
    
    const submissions = db.get('submissions');
    const allSubmissions = submissions.value();
    const trimmedName = name.trim();
    
    // Check if user already exists (case-insensitive)
    const existingSubmission = allSubmissions.find(
        s => s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (existingSubmission) {
        // Update existing submission
        submissions.find({ name: existingSubmission.name })
            .assign({ dates: dates })
            .write();
        res.status(200).send({ message: 'Your submission has been updated!' });
    } else {
        // Add new submission
        submissions.push({ name: trimmedName, dates: dates }).write();
        res.status(201).send({ message: 'Dates saved successfully!' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
