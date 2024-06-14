const DEPOSITS = require('./deposits');

function getListDeposits() {
    const rand = Math.random();

    return new Promise((res) => {
        setTimeout(() => {
            res({
                json: () => Promise.resolve(DEPOSITS),
                status: rand < 0.8 ? 200 : 404,
            });
        }, 300);
    });
}

module.exports = {
    getListDeposits,
};
