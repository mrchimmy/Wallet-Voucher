/**
 * Wallet-Voucher — redeem a TrueMoney Wallet gift voucher (อั่งเปา).
 *
 * Uses the platform `fetch` built into modern Node, so this package has no
 * runtime dependencies. Requires Node >= 20.3 (for `AbortSignal.any`).
 */
export interface VoucherOptions {
    /** Abort the request after this many ms. Defaults to 15000. */
    timeout?: number;
    /** Cancel the request from the caller's side. Combined with `timeout`. */
    signal?: AbortSignal;
    /**
     * Bring your own HTTP client, matching the `fetch` signature. Useful for
     * tests, and for routing the call through your own infrastructure.
     */
    fetch?: typeof globalThis.fetch;
}
export interface VoucherResult {
    status: "success";
    /** Passed through from the API untouched — a decimal amount in baht. */
    amount: string | number;
    /** The voucher hash that was redeemed. */
    hash: string;
    /** The full API payload, so you can read fields this package doesn't map. */
    raw: unknown;
}
/**
 * Every failure thrown by `Voucher` is a `VoucherError`. Branch on `.code`
 * rather than `.message` — codes are stable, messages are not.
 *
 * Local codes: `MISSING_ARGUMENT`, `INVALID_MOBILE`, `INVALID_VOUCHER`,
 * `TIMEOUT`, `NETWORK_ERROR`, `REQUEST_BLOCKED`, `BAD_RESPONSE`.
 * Any other code comes straight from TrueMoney (e.g. `VOUCHER_NOT_FOUND`,
 * `VOUCHER_OUT_OF_STOCK`, `TARGET_USER_REDEEMED`).
 */
export declare class VoucherError extends Error {
    readonly code: string;
    readonly httpStatus?: number;
    /**
     * True when the voucher's fate is unknown — the request may have been
     * redeemed upstream even though we never saw a reply. Reconcile these
     * manually instead of treating them as a plain failure.
     */
    readonly indeterminate: boolean;
    constructor(code: string, message: string, opts?: {
        httpStatus?: number;
        indeterminate?: boolean;
        cause?: unknown;
    });
}
/**
 * Redeem a voucher into a wallet.
 *
 * @param mobile  Recipient wallet number, 10 digits.
 * @param voucher A campaign link (`https://gift.truemoney.com/campaign/?v=...`)
 *                or the bare hash.
 * @throws {VoucherError} on any failure — see `VoucherError` for codes.
 */
export declare const Voucher: (mobile: string, voucher: string, options?: VoucherOptions) => Promise<VoucherResult>;
export default Voucher;
