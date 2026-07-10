const express = require('express');
const router = express.Router();
const pool = require('../db/');



router.get('/', async (req, res) => {
    try {
    const result  = await pool.query('SELECT * FROM envelopes');
    res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.get('/:id', async (req, res) => {
    try {
    const id = Number(req.params.id);
    const result = await pool.query('SELECT * FROM envelopes WHERE id = $1', [id]);

    if (result.rows.length === 0) {
        return res.status(404).send("Envelope not found");
    }

    res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.post('/', async (req, res) => {

    try {
    const { title, balance } = req.body;
    if(!title || balance === undefined) {
        return res.status(400).send("Bad Request");
    }

    const result = await pool.query('INSERT INTO envelopes (title, balance) VALUES ($1, $2) RETURNING *', [title, balance]);
    res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.post('/transfer', async (req, res) => {
    const { from, to, amount } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const sender = await client.query(
    'SELECT * FROM envelopes WHERE id = $1',
    [from]
    );

    const receiver = await client.query(
        'SELECT * FROM envelopes WHERE id = $1',
        [to]
    );

    if (sender.rows.length === 0 || receiver.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).send("Either Sender or Receiver doesn't exist.");
    }   
    if(sender.rows[0].id === receiver.rows[0].id) {
        await client.query('ROLLBACK');
        return res.status(400).send("Sender and Receiver both are same!");
    }

    if(amount <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).send("Not a valid amount!")
    }

    if(amount > sender.rows[0].balance) {
        await client.query('ROLLBACK');
        return res.status(400).send("The amount you are sending is greater than the balance sender has")
    }

    const senderResult = await client.query('UPDATE envelopes SET balance = balance - $1 WHERE id = $2 RETURNING *', [amount, sender.rows[0].id]);
    const receiverResult = await client.query('UPDATE envelopes SET balance = balance + $1 WHERE id = $2 RETURNING *', [amount, receiver.rows[0].id]);

    await client.query('COMMIT'); 

    res.status(200).json({
    message: "Transfer successful",
    sender: senderResult.rows[0],
    receiver: receiverResult.rows[0]
    });
} catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send("Server Error");
} finally {
    client.release();
}
});

router.put('/:id', async (req, res) => {

    try {
    const id = Number(req.params.id);
    const { title, balance } = req.body;

    if (title === undefined && balance === undefined) {
    return res.status(400).send("Bad Request");
    }

    const result = await pool.query('UPDATE envelopes SET title = COALESCE($1, title), balance = COALESCE($2, balance) WHERE id = $3 RETURNING *', [title, balance, id]);

    if (result.rows.length === 0) {
        return res.status(404).send("Envelope not found");
    }
    
    res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.delete('/:id', async (req, res) => {

    try {
    const id = Number(req.params.id);
    const result = await pool.query('DELETE FROM envelopes WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
    return res.status(404).json({
        message: "Envelope not found"
    });
    }

    res.status(200).json({
        message: "Envelope deleted successfully"
    });
    
} catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
}

});

module.exports = router;