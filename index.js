"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Voucher = void 0;
const undici_1 = require("undici");
const Voucher = (mobile, voucher) => __awaiter(void 0, void 0, void 0, function* () {
    let roundHash = [10, 18];
    if ((mobile === "" || voucher === ""))
        throw Error("Enter Mobile and Voucher");
    if (mobile.length !== roundHash[0] || mobile.match(/\D/))
        throw Error("invaild_number_phone");
    let hash = voucher.split("v=");
    let voucher_hash = (hash[1] || hash[0]).match(/[0-9A-Za-z]+/);
    if (roundHash[1] !== voucher_hash[0].length)
        throw Error("invaild_voucher");
    const data = yield (0, undici_1.fetch)(`https://gift.truemoney.com/campaign/vouchers/${voucher_hash[0]}/redeem`, {
        method: "post",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile, voucher_hash: voucher_hash[0] })
    }).then((response) => response.json());
    if (data.status.message === "success") {
        return {
            status: "success",
            amount: data.data.my_ticket.amount_baht,
            hash: voucher_hash[0],
        };
    }
    throw Error(data.status.message);
});
exports.Voucher = Voucher;
module.exports = (mobile, voucher) => __awaiter(void 0, void 0, void 0, function* () {
    let roundHash = [10, 18];
    if ((mobile === "" || voucher === ""))
        throw Error("Enter Mobile and Voucher");
    if (mobile.length !== roundHash[0] || mobile.match(/\D/))
        throw Error("invaild_number_phone");
    let hash = voucher.split("v=");
    let voucher_hash = (hash[1] || hash[0]).match(/[0-9A-Za-z]+/);
    if (roundHash[1] !== voucher_hash[0].length)
        throw Error("invaild_voucher");
    const data = yield (0, undici_1.fetch)(`https://gift.truemoney.com/campaign/vouchers/${voucher_hash[0]}/redeem`, {
        method: "post",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile, voucher_hash: voucher_hash[0] })
    }).then((response) => response.json());
    if (data.status.message === "success") {
        return {
            status: "success",
            amount: data.data.my_ticket.amount_baht,
            hash: voucher_hash[0],
        };
    }
    throw Error(data.status.message);
});
