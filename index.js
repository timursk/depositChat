const { getListDeposits } = require('./api');

const readline = require('readline').createInterface({
    input: process.stdin,
});

const ACTIONS = {
    requestDeposit: 'requestDeposit',
    requestAccept: 'requestAccept',
};

class Chat {
    constructor() {
        this.message = '';
        this.currentAction = ACTIONS.requestDeposit;
        this.isActive = true;
        this.handlers = {};
    }

    on(action, fn) {
        this.handlers[action] = fn;
    }

    call(action, ...args) {
        const fn = this.handlers[action];

        if (fn && this.isActive) {
            fn.apply(this, args);
        }
    }

    sendMessage(message) {
        console.log(message);
    }

    handleMessage(message) {
        message = message.trim();
        this.call(this.currentAction, message);
    }

    stopListen() {
        this.isActive = false;
    }

    enableListen() {
        this.isActive = true;
    }
}

const bot = new Chat();

bot.on(ACTIONS.requestDeposit, requestDeposit);
bot.on(ACTIONS.requestAccept, requestAccept);

readline.on('line', (line) => {
    bot.handleMessage(line);
});

async function requestDeposit(message) {
    const regex = /^(хочу )?открыть вклад .+$/i;
    const isValid = regex.test(message);

    if (!isValid) {
        bot.sendMessage('Я не понял ваш запрос.');
        return;
    }

    bot.stopListen();

    try {
        const response = await getListDeposits();

        if (response.status !== 200) {
            throw new Error();
        }

        const deposits = await response.json();

        const requestedDepositName = message
            .replace(/^(хочу )?открыть вклад\s/i, '')
            .trim()
            .toLowerCase();

        const deposit = deposits.find(
            (currentDeposit) =>
                currentDeposit.productName.toLowerCase() ===
                requestedDepositName
        );

        if (!deposit) {
            bot.sendMessage('Такого вклада нет.');
            return;
        }

        const product = deposit.products[0];
        const terms = product.terms[0];
        const rate = terms.rates[0];

        const botResponse = `
              Название: ${deposit.productName} 
              Срок вклада: ${terms.minimumTerm} 
              Процентная ставка: ${product.maxProfitRate}% 
              Минимальная сумма: ${rate.minBalance} ${product.currency.alphaCode}
      
              Вы согласны открыть вклад?
          `;

        bot.sendMessage(botResponse);
        bot.currentAction = ACTIONS.requestAccept;
    } catch (e) {
        bot.sendMessage('Попробуйте заново.');
    } finally {
        bot.enableListen();
    }
}

async function requestAccept(message) {
    if (/^(да|согласен)$/i.test(message)) {
        bot.sendMessage('Отлично! Вклад открыт.');
        readline.close();
    } else if (/^(нет|не согласен)$/i.test(message)) {
        bot.sendMessage('Жаль, что условия вам не подошли. Приходите ещё.');
        bot.currentAction = ACTIONS.requestDeposit;
    } else {
        bot.sendMessage('Ответьте "да" или "нет"');
    }
}
