const express = require('express');
const cors = require('cors');
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const app = express();

const envelopesRouter = require('./routes/envelopes');
const transactionsRouter = require('./routes/transactions');
const swaggerDocument = YAML.load("./swagger/swagger.yaml");

const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/envelopes', envelopesRouter);
app.use('/transactions', transactionsRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.get('/', (req, res) => {
  res.send('Welcome to the Budgeting App!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});