const path = require('path');
const request = require('request');
const parseJson = require('parse-json');
const { app, BrowserWindow, TouchBar } = require('electron');
const { TouchBarLabel } = TouchBar;

const buttons = [];
const apis = {
  gdax: 'https://api.gdax.com/products/|/ticker',
  cmc: 'https://api.coinmarketcap.com/v1/ticker/|'
}
const currencies = [
  {
    productId: 'BTC-USD',
    symbol:    '\u20bf',
    api:       'gdax',
    precision: 2,
    icon: path.join(__dirname, '/currencies/btc.png')
  },
  {
    productId: 'ETH-USD',
    symbol:    '\u039e',
    api:       'gdax',
    precision: 2
  },
  {
    productId: 'LTC-USD',
    symbol: 'L',
    api:    'gdax',
    precision: 2
  },
  {
    productId: 'ripple',
    symbol:    'R',
    api:       'cmc',
    precision: 6
  }
];

currencies.forEach(({ productId, icon }) => {
  buttons.push(new TouchBarLabel({
    label:           ''
  }));
});

const getLatestTick = (currency, callback) => {
  var api = currency.api;
  var url = apis[api].replace('|', currency.productId);
  var options = {
    url: url,
    headers: {
      'User-Agent': 'request'
    }
  };

  request(options, callback);
}

const updateTickers = () => {
  buttons.forEach((button, index) => {
    const currency = currencies[index];
    getLatestTick(currency, (error, response, body) => {
      if (error) {
        button.label = `${currency.symbol}: error!`;
        return;
      }

      const json = parseJson(body);
      var price;
      if(currency.api === 'gdax') {
        price = parseFloat(json.price, 2);
      } else {
        price = parseFloat(json[0].price_usd, 6);
      }
      if (currency.price < price) {
        button.textColor = '#98FB98';
      } else if (currency.price > price) {
        button.textColor = '#FB9898';
      } else {
        button.textColor = '#FFFFFF';
      }
      button.label = `${currency.symbol} ${price.toFixed(currency.precision)}`;
      currency.price = price;
    })
  });
}

const update = () => {
  setInterval(updateTickers, 2000)
};

updateTickers();

const touchBar = new TouchBar(buttons);

let window;

app.once('ready', () => {
  window = new BrowserWindow({
    width:  300,
    height: 200
  });

  window.loadURL(`file://${path.join(__dirname, '/index.html')}`);
  window.setTouchBar(touchBar);
  update();
})

// Quit when all windows are closed and no other one is listening to this.
app.on('window-all-closed', () => {
  app.quit();
});
