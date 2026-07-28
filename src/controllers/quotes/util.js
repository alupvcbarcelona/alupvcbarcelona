const Counter = require("../../models/Counter");

async function generateNumber() {

    const year = new Date().getFullYear();

    let counter = await Counter.findOne({ year });

    if (!counter) {

        counter = await Counter.create({
            year,
            sequence: 1
        });

    } else {

        counter.sequence++;

        await counter.save();

    }

    return `${year}-${String(counter.sequence).padStart(6,"0")}`;

}