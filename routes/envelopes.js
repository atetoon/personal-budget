const express = require('express');
const router = express.Router();

const envelopes = require('../data/envelopes');

router.get('/', (req, res) => {
    res.json(envelopes);
});

router.get('/:id', (req, res) => {
    const id = Number(req.params.id);
    const envelope = envelopes.find(e => e.id === id);

    if(!envelope) {
      return res.status(404).send("Envelope not found");
    }

    res.json(envelope);
})

router.post('/', (req, res) => {
    const { title, balance } = req.body;
    if(!title || balance === undefined) {
        return res.status(400).send("Bad Request");
    }

    const id = envelopes.length > 0 ? envelopes[envelopes.length - 1].id + 1 : 1;

    const newEnvelope = {
        id: id,
        title: title,
        balance: balance
    };
    envelopes.push(newEnvelope);
    res.status(201).json(newEnvelope); 
});

router.post('/transfer', (req, res) => {
    const { from, to, amount } = req.body;
    const indexSender = envelopes.findIndex(e => e.id === from);
    const indexReceiver = envelopes.findIndex(e => e.id === to);

    if(indexSender === -1 || indexReceiver === -1) {
        return res.status(404).send("Either Sender or Receiver doesn't exist.");
    }
    if(indexSender === indexReceiver) {
        return res.status(400).send("Sender and Receiver both are same!");
    }

    if(amount <= 0) {
        return res.status(400).send("Not a valid amount!")
    }

    if(amount > envelopes[indexSender].balance) {
        return res.status(400).send("The amount you are sending is greater than the balance sender has")
    }

    envelopes[indexSender].balance -= amount;
    envelopes[indexReceiver].balance += amount;

    res.status(200).json({
    message: "Transfer successful",
    sender: envelopes[indexSender],
    receiver: envelopes[indexReceiver]
    });

});

router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    const envelope = envelopes.find(e => e.id === id);

    if(!envelope) {
        return res.status(404).send("Envelope doesn't exist in Database");
    }

    const { title, balance } = req.body;

    if (title === undefined && balance === undefined) {
    return res.status(400).send("Bad Request");
    }

    if(title !== undefined) {
        envelope.title = title;
    }

    if(balance !== undefined) {
        envelope.balance = balance;
    }

    res.json(envelope);
});

router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = envelopes.findIndex(e => e.id === id);

    if(index !== -1) {
        envelopes.splice(index, 1);
        return res.status(200).send("Envelope deleted successfully");
    }
    
    return res.status(404).json({ message: "Envelope not found" });

});

module.exports = router;