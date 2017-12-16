const path = require('path');
const request = require('request');
const parseJson = require('parse-json');
const { app, BrowserWindow, TouchBar } = require('electron');
const { TouchBarButton, TouchBarGroup, TouchBarSpacer } = TouchBar;

const buttons = [];
const apis = {
  gdax: {
    url: 'https://api.gdax.com/products/|/ticker',
    parse_price: function(json) { return parseFloat(json.price, 2); }
  },
  cmc: {
      url: 'https://api.coinmarketcap.com/v1/ticker/|',
      parse_price: function(json) { return parseFloat(json[0].price_usd, 6); }
  }
}
const currencies = [
  {
    productId: 'BTC-USD',
    symbol:    '\u20bf',
    api:       'gdax',
    precision: 2,
    icon: 'btc_icon.png',
    web_url: 'https://www.coinbase.com/charts'
  },
  {
    productId: 'ETH-USD',
    symbol:    '\u039e',
    api:       'gdax',
    precision: 2,
    icon: 'eth_icon.png',
    web_url: 'https://www.coinbase.com/charts'
  },
  {
    productId: 'LTC-USD',
    symbol: 'L',
    api:    'gdax',
    precision: 2,
    icon: 'ltc_icon.png',
    web_url: 'https://www.coinbase.com/charts'
  },
  {
    productId: 'ripple',
    symbol:    'R',
    api:       'cmc',
    precision: 6,
    icon: 'xrp_icon.png',
    web_url: 'https://coinmarketcap.com/currencies/ripple/'
  }
];

currencies.forEach(({ productId, icon, web_url }) => {
  buttons.push(new TouchBarButton({
    label:           '',
    icon: path.join(__dirname, `/currencies/${icon}`),
    iconPosition:    'left',
    click: () => {
      window = new BrowserWindow({ });
      window.loadURL(web_url);
    }
  }));
});

const getLatestTick = (currency, callback) => {
  var api = currency.api;
  var url = apis[api].url.replace('|', currency.productId);
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
      price = apis[currency.api].parse_price(json);
      if (currency.price < price) {
        button.backgroundColor = '#98FB98';
      } else if (currency.price > price) {
        button.backgroundColor = '#FB9898';
      } else {
        button.backgroundColor = '#FFFFFF';
      }
      button.label = `${price.toFixed(currency.precision)}`;
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
