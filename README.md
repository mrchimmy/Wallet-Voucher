# Wallet-Voucher :red_envelope:

Wallet Voucher หรืออีกชื่อคือ อั่งเปา API สำหรับขึ้นเงินซองอั่งเปาของ TrueMoney Wallet บน Node.js — ไม่มี dependency, มี TypeScript types มาให้ในตัว

* [สถานะปัจจุบัน](#สถานะปัจจุบัน-)
* [Requirements](#requirements)
* [Installation](#installation)
* [Usage](#usage)
  - [Example](#example)
  - [TypeScript](#typescript)
  - [NodeJS Express](#nodejs-express)
* [API Reference](#api-reference)
* [Error Handling](#error-handling)
* [Migration v1 → v2](#migration-v1--v2)
* [Author](#author)

## สถานะปัจจุบัน :warning:

**ทดสอบล่าสุด 13 ส.ค. 2569 — request จาก Node.js ถูก Cloudflare บล็อกที่หน้า edge (HTTP 403) ก่อนถึง API**

endpoint ของ TrueMoney ยังทำงานปกติและรูปแบบ response ไม่เปลี่ยน แต่ตอนนี้ `gift.truemoney.com` มี bot protection ที่บล็อก HTTP client ของ Node ทั้ง `fetch` และ `node:https` (ทดสอบแล้วทั้งคู่ ไม่เกี่ยวกับ header หรือ IP) ถ้าเรียกใช้ตอนนี้จะได้ error code `REQUEST_BLOCKED`

endpoint นี้เป็น **API ภายในที่ไม่เป็นทางการ** — TrueMoney เปลี่ยนหรือปิดกั้นได้ตลอดเวลาโดยไม่แจ้งล่วงหน้า ถ้าใช้กับระบบที่รับเงินจริง แนะนำให้ติดต่อขอใช้ช่องทาง merchant/partner อย่างเป็นทางการแทน

## Requirements

Node.js **20.3.0** ขึ้นไป (ใช้ `fetch` และ `AbortSignal.any` ที่มีมาในตัว จึงไม่ต้องลง dependency เพิ่ม)

## Installation

```bash
npm install @mrchimky/voucherjs
```

## Usage

### Example

```js
const voucher = require("@mrchimky/voucherjs");

voucher("0123456789", "https://gift.truemoney.com/campaign/?v=bgavSkg5hspZYKzcdk")
  .then((result) => {
    console.log(`สถานะ: ${result.status} | จำนวน: ${result.amount} บาท`);
  })
  .catch((error) => {
    console.log(`ผิดพลาด [${error.code}]: ${error.message}`);
  });
```

รองรับทั้ง `require` และ `import` — เลือกใช้แบบใดแบบหนึ่ง

CommonJS:

```js
const voucher = require("@mrchimky/voucherjs");     // ตัว module เรียกเป็นฟังก์ชันได้เลย
const { Voucher, VoucherError } = require("@mrchimky/voucherjs");
```

ES Modules:

```js
import Voucher, { VoucherError } from "@mrchimky/voucherjs";
```

### TypeScript

types มาพร้อม package ไม่ต้องลง `@types` เพิ่ม

```ts
import { Voucher, VoucherError } from "@mrchimky/voucherjs";

try {
  const result = await Voucher("0123456789", "ลิ้งค์อั่งเปา หรือ โค้ดอั่งเปา");
  console.log(`สถานะ: ${result.status} | จำนวน: ${result.amount} บาท`);
} catch (error) {
  if (error instanceof VoucherError) {
    console.log(error.code, error.message);
  }
}
```

### NodeJS Express

> :warning: อย่าตั้งชื่อตัวแปรที่รับจาก `req.body` ทับชื่อฟังก์ชันที่ import มา — ตัวอย่างใน README เวอร์ชันก่อนหน้าพลาดตรงนี้

```js
const { Voucher, VoucherError } = require("@mrchimky/voucherjs");

app.post("/voucher", async (req, res) => {
  const { mobile, voucherLink } = req.body;

  try {
    const result = await Voucher(mobile, voucherLink);
    res.json({ status: result.status, amount: result.amount });
  } catch (error) {
    if (error instanceof VoucherError && error.indeterminate) {
      // ไม่รู้ผลลัพธ์ — ซองอาจถูกใช้ไปแล้ว ห้ามให้ผู้ใช้ลองใหม่ทันที
      console.error("ต้องตรวจสอบด้วยมือ:", error.code, mobile, voucherLink);
      return res.status(503).json({ error: "ระบบไม่ทราบผล กรุณาติดต่อแอดมิน" });
    }
    res.status(400).json({ error: error.message, code: error.code });
  }
});
```

## API Reference

### `Voucher(mobile, voucher, options?)`

| Parameter | Type | Description |
| --- | --- | --- |
| `mobile` | `string` | เบอร์วอเลตผู้รับเงิน 10 หลัก **Required** |
| `voucher` | `string` | ลิ้งค์อั่งเปา หรือโค้ดอั่งเปา (35 ตัวอักษร) **Required** |
| `options` | `object` | ตัวเลือกเพิ่มเติม *(ไม่บังคับ)* |

**options**

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `timeout` | `number` | `15000` | ยกเลิก request หลังผ่านไปกี่ ms |
| `signal` | `AbortSignal` | – | ให้ผู้เรียกยกเลิกเองได้ ใช้ร่วมกับ `timeout` |
| `fetch` | `typeof fetch` | global `fetch` | ใส่ HTTP client ของตัวเองได้ (สำหรับเทสต์ หรือส่งผ่าน infra ของคุณเอง) |

**ค่าที่คืนกลับมา** — `Promise<VoucherResult>`

| Field | Type | Description |
| --- | --- | --- |
| `status` | `"success"` | สำเร็จเสมอ เพราะกรณีไม่สำเร็จจะ throw |
| `amount` | `string \| number` | จำนวนเงินตามที่ API ส่งมา (ปกติเป็น string เช่น `"10.00"`) |
| `hash` | `string` | hash ของซองที่ขึ้นเงินไปแล้ว |
| `raw` | `unknown` | payload ดิบทั้งก้อน เผื่ออยากอ่าน field ที่ package ไม่ได้ map ไว้ |

## Error Handling

ทุก error ที่ throw ออกมาเป็น `VoucherError` — **ให้เช็คที่ `.code` ไม่ใช่ `.message`** เพราะ code นิ่งกว่า

| Code | ความหมาย |
| --- | --- |
| `MISSING_ARGUMENT` | ไม่ได้ส่ง `mobile` หรือ `voucher` มา หรือส่งมาไม่ใช่ string |
| `INVALID_MOBILE` | เบอร์ไม่ใช่ตัวเลข 10 หลัก |
| `INVALID_VOUCHER` | แกะ hash จากลิ้งค์ไม่ได้ หรือความยาวไม่ใช่ 35 |
| `REQUEST_BLOCKED` | โดนบล็อกที่ edge (HTTP 403) ยังไปไม่ถึง API — ดู [สถานะปัจจุบัน](#สถานะปัจจุบัน-) |
| `BAD_RESPONSE` | ตอบกลับมาไม่ใช่ JSON หรือรูปแบบไม่ตรงที่คาด |
| `TIMEOUT` | ครบเวลาแล้วยังไม่ตอบ |
| `NETWORK_ERROR` | ต่อไม่ติด |
| อื่น ๆ | ส่งต่อจาก TrueMoney ตรง ๆ เช่น `VOUCHER_NOT_FOUND`, `VOUCHER_OUT_OF_STOCK`, `TARGET_USER_REDEEMED` |

**Field ของ `VoucherError`**

| Field | Type | Description |
| --- | --- | --- |
| `code` | `string` | ตามตารางด้านบน |
| `message` | `string` | ข้อความอธิบาย |
| `httpStatus` | `number?` | HTTP status ถ้ามี |
| `indeterminate` | `boolean` | **ไม่ทราบผลลัพธ์** |

### :warning: เรื่อง `indeterminate`

`TIMEOUT` และ `NETWORK_ERROR` จะมี `indeterminate === true` แปลว่า request อาจไปถึง TrueMoney และ**ซองถูกใช้ไปแล้ว**ก็ได้ เราแค่ไม่ได้รับคำตอบกลับมา

อย่าปฏิบัติกับเคสนี้เหมือน "ล้มเหลว" ธรรมดา — ถ้าให้ผู้ใช้กดใหม่ทันทีจะได้ `VOUCHER_NOT_FOUND` ทั้งที่เงินออกจากซองไปแล้ว ควร log ไว้แล้วตรวจสอบด้วยมือ

## Migration v1 → v2

v2 เป็น breaking change:

| v1.x | v2.0 |
| --- | --- |
| ต้องลง `undici` | ไม่มี dependency (ใช้ `fetch` ในตัวของ Node) |
| รองรับ Node เก่า | ต้อง Node >= 20.3.0 |
| `require(pkg).Voucher` เป็น `undefined` | ใช้ได้แล้วทุกรูปแบบ |
| ไม่มี TypeScript types | มี `index.d.ts` มาให้ |
| `throw Error("invaild_number_phone")` | `throw new VoucherError("INVALID_MOBILE", ...)` |
| `throw Error("invaild_voucher")` | `throw new VoucherError("INVALID_VOUCHER", ...)` |
| `throw Error("Enter Mobile and Voucher")` | `throw new VoucherError("MISSING_ARGUMENT", ...)` |
| response ไม่ใช่ JSON → `SyntaxError` งง ๆ | `VoucherError` code `REQUEST_BLOCKED` / `BAD_RESPONSE` |
| ไม่มี timeout | timeout 15 วินาที ปรับได้ |
| คืน `{ status, amount, hash }` | เพิ่ม `raw` เข้ามา field เดิมยังอยู่ครบ |

โค้ดเดิมที่เขียนแบบ `voucher(mobile, link).then(r => r.amount)` ยังใช้ได้เหมือนเดิม ส่วนที่ต้องแก้คือโค้ดที่ไปเช็ค `error.message` ตรง ๆ ให้เปลี่ยนไปเช็ค `error.code` แทน

## Development

```bash
npm install
npm run build   # tsc -> index.js + index.d.ts
npm test        # node:test, ไม่ยิงเน็ตจริง
```

## Author

- [@mrchimky](https://www.github.com/mrchimmy)

## License

[MIT](https://choosealicense.com/licenses/mit/)
