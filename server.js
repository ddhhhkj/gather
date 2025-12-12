const express = require('express');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

// Set up the database with a default 'dates' array
db.defaults({ dates: [] }).write();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files from the root directory

app.get('/api/dates', (req, res) => {
    const dates = db.get('dates').value();
    res.json(dates);
});

app.post('/api/dates', (req, res) => {
    const { dates } = req.body;
    if (dates && Array.isArray(dates)) {
        const datesDb = db.get('dates');
        dates.forEach(date => {
            datesDb.push(date).write();
        });
        res.status(201).send({ message: 'Dates saved successfully!' });
    } else {
        res.status(400).send({ message: 'Invalid data format. Expected an array of dates.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
