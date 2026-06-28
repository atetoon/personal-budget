const isLiveServer =
    (window.location.hostname === "localhost" ||
     window.location.hostname === "127.0.0.1") &&
    window.location.port !== "3000";

const API_URL = isLiveServer
    ? "http://localhost:3000/envelopes"
    : "/envelopes";

const envelopeList = document.getElementById("envelope-list");
const count = document.getElementById("count");

// Create
const titleInput = document.getElementById("title");
const balanceInput = document.getElementById("balance");
const createBtn = document.getElementById("create-btn");

// Transfer
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");
const amountInput = document.getElementById("amount");
const transferBtn = document.getElementById("transfer-btn");


// Load Envelopes


async function loadEnvelopes() {
    try {
        const response = await fetch(API_URL);
        const envelopes = await response.json();

        displayEnvelopes(envelopes);
        populateDropdowns(envelopes);

        count.textContent = `${envelopes.length} Envelope${envelopes.length !== 1 ? "s" : ""}`;

    } catch (err) {
        console.error(err);
    }
}

// Display Envelopes


function displayEnvelopes(envelopes) {

    envelopeList.innerHTML = "";

    envelopes.forEach(envelope => {

        const envelopeCard = document.createElement("div");
        envelopeCard.className = "envelope";

        const info = document.createElement("div");

        const title = document.createElement("h3");
        title.textContent = envelope.title;

        const balance = document.createElement("p");
        balance.textContent = `₹${envelope.balance}`;

        info.appendChild(title);
        info.appendChild(balance);

        const actions = document.createElement("div");
        actions.className = "actions";

        // Edit Button
        const editBtn = document.createElement("button");
        editBtn.className = "edit";
        editBtn.textContent = "Edit";

        editBtn.addEventListener("click", () => {
            editEnvelope(envelope.id);
        });

        // Delete Button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete";
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", () => {
            deleteEnvelope(envelope.id);
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        envelopeCard.appendChild(info);
        envelopeCard.appendChild(actions);

        envelopeList.appendChild(envelopeCard);
    });

}

// Populate Dropdowns

function populateDropdowns(envelopes) {

    fromSelect.innerHTML = "";
    toSelect.innerHTML = "";

    envelopes.forEach(envelope => {

        fromSelect.innerHTML += `
            <option value="${envelope.id}">
                ${envelope.title}
            </option>
        `;

        toSelect.innerHTML += `
            <option value="${envelope.id}">
                ${envelope.title}
            </option>
        `;
    });
}

// Create Envelope

createBtn.addEventListener("click", async () => {

    const title = titleInput.value.trim();
    const balance = Number(balanceInput.value);

    if (!title || isNaN(balance)) {
        alert("Please enter valid details.");
        return;
    }

    await fetch(API_URL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            title,
            balance
        })

    });

    titleInput.value = "";
    balanceInput.value = "";

    loadEnvelopes();

});

// Delete Envelope

async function deleteEnvelope(id) {

    if (!confirm("Delete this envelope?")) return;

    await fetch(`${API_URL}/${id}`, {

        method: "DELETE"

    });

    loadEnvelopes();

}

// Edit Envelope

async function editEnvelope(id) {

    const title = prompt("Enter new title:");

    if (title === null) return;

    const balance = prompt("Enter new balance:");

    if (balance === null) return;

    await fetch(`${API_URL}/${id}`, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            title,
            balance: Number(balance)
        })

    });

    loadEnvelopes();

}

// Transfer Money

transferBtn.addEventListener("click", async () => {

    const from = Number(fromSelect.value);
    const to = Number(toSelect.value);
    const amount = Number(amountInput.value);

    if (from === to) {
        alert("Sender and receiver cannot be the same.");
        return;
    }

    if (amount <= 0 || isNaN(amount)) {
        alert("Enter a valid amount.");
        return;
    }

    const response = await fetch(`${API_URL}/transfer`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            from,
            to,
            amount
        })

    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message || "Transfer failed.");
        return;
    }

    amountInput.value = "";

    loadEnvelopes();

});

// Initial Load

loadEnvelopes();