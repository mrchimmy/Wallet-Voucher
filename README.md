# Wallet-Voucher :red_envelope:

Wallet Voucher หรืออีกชื่อคือ อั่งเปา APi สามารถใช้เพื่อทำระบบเติมเงินด้วย ซองอั่งเปาของ Truemoney Wallet ได้ พร้อม Callback

โดยอั่งเปา APi :red_envelope: นี้ใช้ได้กับ JavaScript, NodeJS Express เป็นต้น :white_check_mark:

* [Installation](#installation)
* [Usage](#usage)
  - [Example](#example)
  - [Javascript](#javascript)
  - [NodeJS Express](#nodejs-express)
* [Async/Await](#asyncawait)
* [API Reference](#api-reference)
* [Author](#author)

# Installation
การติดตั้งสำหรับ NodeJS โดยใช้ **npm install** command :
```
$ npm install @mrchimky/voucherjs
```

# Usage
Package ของเรา ซับพอร์ดหลายรูปแบบสามารถเลือกใช้ได้ตามรูปแบบงานของท่าน

## Example
* ตัวอย่าง เริ่มต้น
```js
const voucher = require("@mrchimky/voucherjs");

voucher('0123456789', 'https://gift.truemoney.com/campaign/?v=bgavSkg5hspZYKzcdk').then((result) => {
  console.log(`สถานะ:  ${result.status} | จำนวน: ${result.amount} บาท `);
}).catch(error) {
  console.log(error);
}
```

### JavaScript
* ตัวอย่าง การเรียกใช้ สำหรับ **JavaScript**
```js
const voucher = require("@mrchimky/voucherjs");

voucher('เบอร์วอเลต', 'ลิ้งค์อั่งเปา หรือ โค้ตอั่งเปา').then((result) => {
  console.log(`สถานะ:  ${result.status} | จำนวน: ${result.amount} บาท `);
}).catch(error) {
  console.log(error);
}
```
หรือ
```js
import { Voucher } from '@mrchimky/voucherjs'

Voucher('เบอร์วอเลต', 'ลิ้งค์อั่งเปา หรือ โค้ตอั่งเปา').then((result) => {
  console.log(`สถานะ:  ${result.status} | จำนวน: ${result.amount} บาท `);
}).catch(error) {
  console.log(error);
}
```

### NodeJS Express
* ตัวอย่างสำหรับ **NodeJS CommonJS**
```js
const voucher = require("@mrchimky/voucherjs");

app.post("/voucher", (req, res) => {
  const { mobile, voucher } = req.body;
  try {
    voucher(mobile, voucher).then((result) => {
      console.log(`สถานะ:  ${result.status} | จำนวน: ${result.amount} บาท `);
    }).catch(error) {
      console.log(error);
    }
  } catch(error) {
    console.log(error);
  };
});
```

* สำหรับ **NodeJS Mobule**
```js
import { Voucher } from '@mrchimky/voucherjs' or const voucher = require("@mrchimky/voucherjs");

app.post("/voucher", (req, res) => {
  const { mobile, voucher } = req.body;
  try {
    voucher(mobile, voucher).then((result) => {
      console.log(`สถานะ:  ${result.status} | จำนวน: ${result.amount} บาท `);
    }).catch(error) {
      console.log(error);
    }
  } catch(error) {
    console.log(error);
  }
});
```

## Async/Await
* สามารถใช้ร่วมกับ Async/Await ได้

```js
const voucher = require("@mrchimky/voucherjs");

app.post('/voucher', async (req, res) => {
  try {
    const data = await voucher('เยอร์วอเลต', 'ลิ้งค์อั่งเปา');
    console.log(`สถานะ:  ${data.status} | จำนวน: ${data.amount} บาท `)
  } catch (error) {
    console.log(error);
  }
})
```

# API Reference
| Parameter | Type | Description |
| --- | --- | --- | 
| `mobile` | `string` | ส่วนของเบอร์วอเลตผู้รับเงิน **Required** |
| `voucher` | `string` | ส่วนของลิ้งค์อั่งเปา หรือจะใช้ โค้ตอั่งเปาก็ได้ **Required** |

## Author

- [@mrchimky](https://www.github.com/mrchimmy)


## License

[MIT](https://choosealicense.com/licenses/mit/)
