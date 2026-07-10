const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM transactions ORDER BY date DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const result = await pool.query(
            "SELECT * FROM transactions WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Transaction not found",
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.post("/", async (req, res) => {
    try {
        const { envelope_id, amount, recipient, description } = req.body;

        if (
            !envelope_id ||
            amount === undefined ||
            !recipient ||
            !description
        ) {
            return res.status(400).send("Bad Request");
        }

        // checking if envelope exists
        const envelope = await pool.query(
            "SELECT * FROM envelopes WHERE id = $1",
            [envelope_id]
        );

        if (envelope.rows.length === 0) {
            return res.status(404).send("Envelope not found");
        }

        // checking balance
        if (amount > envelope.rows[0].balance) {
            return res.status(400).send("Insufficient balance");
        }

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const transactionResult = await client.query(
                `INSERT INTO transactions
                (envelope_id, amount, recipient, description)
                VALUES ($1, $2, $3, $4)
                RETURNING *`,
                [envelope_id, amount, recipient, description]
            );

            await client.query(
                `UPDATE envelopes
                 SET balance = balance - $1
                 WHERE id = $2`,
                [amount, envelope_id]
            );

            await client.query("COMMIT");

            res.status(201).json(transactionResult.rows[0]);

        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


router.put("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const { amount, recipient, description } = req.body;

        if (
            amount === undefined &&
            recipient === undefined &&
            description === undefined
        ) {
            return res.status(400).send("Bad Request");
        }

        const result = await pool.query(
            `UPDATE transactions
             SET
                amount = COALESCE($1, amount),
                recipient = COALESCE($2, recipient),
                description = COALESCE($3, description)
             WHERE id = $4
             RETURNING *`,
            [amount, recipient, description, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send("Transaction not found");
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const result = await pool.query(
            "DELETE FROM transactions WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Transaction not found",
            });
        }

        res.status(200).json({
            message: "Transaction deleted successfully",
            transaction: result.rows[0],
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;