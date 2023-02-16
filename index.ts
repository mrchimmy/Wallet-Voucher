import { fetch } from "undici";

export const Voucher = async (mobile: string, voucher: string) => {
    let roundHash = [10, 18];
    if ((mobile === "" || voucher === "")) throw Error("Enter Mobile and Voucher");
    if (mobile.length !== roundHash[0] || mobile.match(/\D/)) throw Error("invaild_number_phone");
    let hash = voucher.split("v=");
    let voucher_hash: any = (hash[1] || hash[0]).match(/[0-9A-Za-z]+/);
    if (roundHash[1] !== voucher_hash[0].length) throw Error("invaild_voucher");

    const data = await fetch(
        `https://gift.truemoney.com/campaign/vouchers/${voucher_hash[0]}/redeem`,
        {
            method: "post",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ mobile, voucher_hash: voucher_hash[0]})
        }
    ).then((response: any ) => response.json())
    if (data.status.message === "success") {
        return {
            status: "success",
            amount: data.data.my_ticket.amount_baht,
            hash: voucher_hash[0],
        }
    }
    throw Error(data.status.message)
}

module.exports = async (mobile: string, voucher: string) => {
    let roundHash = [10, 18];
    if ((mobile === "" || voucher === "")) throw Error("Enter Mobile and Voucher");
    if (mobile.length !== roundHash[0] || mobile.match(/\D/)) throw Error("invaild_number_phone");
    let hash = voucher.split("v=");
    let voucher_hash: any = (hash[1] || hash[0]).match(/[0-9A-Za-z]+/);
    if (roundHash[1] !== voucher_hash[0].length) throw Error("invaild_voucher");

    const data = await fetch(
        `https://gift.truemoney.com/campaign/vouchers/${voucher_hash[0]}/redeem`,
        {
            method: "post",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ mobile, voucher_hash: voucher_hash[0]})
        }
    ).then((response: any ) => response.json())
    if (data.status.message === "success") {
        return {
            status: "success",
            amount: data.data.my_ticket.amount_baht,
            hash: voucher_hash[0],
        }
    }
    throw Error(data.status.message)
}