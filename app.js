const express = require('express');
const cors = require('cors');
const app = express();

const envelopesRouter = require('./routes/envelopes');

const PORT = 3000;


app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/envelopes', envelopesRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the Budgeting App!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});