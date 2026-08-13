/**
 * Wallet-Voucher — redeem a TrueMoney Wallet gift voucher (อั่งเปา).
 *
 * Uses the platform `fetch` built into modern Node, so this package has no
 * runtime dependencies. Requires Node >= 20.3 (for `AbortSignal.any`).
 */

/** Expected length of a wallet mobile number. */
const MOBILE_LENGTH = 10;

/** Expected length of a voucher hash in TrueMoney's current link format. */
const HASH_LENGTH = 35;

/** Default request timeout in milliseconds. */
const DEFAULT_TIMEOUT = 15_000;

const ENDPOINT = "https://gift.truemoney.com/campaign/vouchers";

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
export class VoucherError extends Error {
    readonly code: string;
    readonly httpStatus?: number;
    /**
     * True when the voucher's fate is unknown — the request may have been
     * redeemed upstream even though we never saw a reply. Reconcile these
     * manually instead of treating them as a plain failure.
     */
    readonly indeterminate: boolean;

    constructor(
        code: string,
        message: string,
        opts: { httpStatus?: number; indeterminate?: boolean; cause?: unknown } = {}
    ) {
        super(message, { cause: opts.cause });
        this.name = "VoucherError";
        this.code = code;
        this.httpStatus = opts.httpStatus;
        this.indeterminate = opts.indeterminate ?? false;
    }
}

/** Pull the hash out of a full campaign link, or accept a bare hash. */
const extractHash = (voucher: string): string => {
    const parts = voucher.split("v=");
    const match = (parts[1] ?? parts[0]).match(/[0-9A-Za-z]+/);
    if (!match) throw new VoucherError("INVALID_VOUCHER", "No voucher hash found in the given value");
    if (match[0].length !== HASH_LENGTH) {
        throw new VoucherError(
            "INVALID_VOUCHER",
            `Voucher hash must be ${HASH_LENGTH} characters, got ${match[0].length}`
        );
    }
    return match[0];
};

/**
 * Redeem a voucher into a wallet.
 *
 * @param mobile  Recipient wallet number, 10 digits.
 * @param voucher A campaign link (`https://gift.truemoney.com/campaign/?v=...`)
 *                or the bare hash.
 * @throws {VoucherError} on any failure — see `VoucherError` for codes.
 */
export const Voucher = async (
    mobile: string,
    voucher: string,
    options: VoucherOptions = {}
): Promise<VoucherResult> => {
    if (!mobile || !voucher) {
        throw new VoucherError("MISSING_ARGUMENT", "Both mobile and voucher are required");
    }
    if (typeof mobile !== "string" || typeof voucher !== "string") {
        throw new VoucherError("MISSING_ARGUMENT", "mobile and voucher must be strings");
    }
    if (mobile.length !== MOBILE_LENGTH || /\D/.test(mobile)) {
        throw new VoucherError("INVALID_MOBILE", `Mobile must be ${MOBILE_LENGTH} digits`);
    }

    const hash = extractHash(voucher);
    const doFetch = options.fetch ?? globalThis.fetch;
    if (typeof doFetch !== "function") {
        throw new VoucherError(
            "NETWORK_ERROR",
            "No fetch implementation available — use Node 20.3+ or pass options.fetch"
        );
    }

    const timeout = options.timeout ?? DEFAULT_TIMEOUT;
    const signals = [AbortSignal.timeout(timeout)];
    if (options.signal) signals.push(options.signal);

    let response: Response;
    try {
        response = await doFetch(`${ENDPOINT}/${hash}/redeem`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ mobile, voucher_hash: hash }),
            signal: AbortSignal.any(signals),
        });
    } catch (cause) {
        // The request never completed, so we cannot know whether the voucher
        // was consumed on TrueMoney's side. Flag it for reconciliation.
        const timedOut = cause instanceof Error && cause.name === "TimeoutError";
        throw new VoucherError(
            timedOut ? "TIMEOUT" : "NETWORK_ERROR",
            timedOut ? `Request timed out after ${timeout}ms` : `Request failed: ${(cause as Error).message}`,
            { indeterminate: true, cause }
        );
    }

    const body = await response.text();
    let data: any;
    try {
        data = JSON.parse(body);
    } catch {
        // Not JSON — almost always an edge/WAF page rather than the API.
        throw new VoucherError(
            response.status === 403 ? "REQUEST_BLOCKED" : "BAD_RESPONSE",
            response.status === 403
                ? "Blocked before reaching the API (HTTP 403 from the edge, not a JSON response)"
                : `Expected JSON, got ${response.headers.get("content-type") ?? "unknown"} (HTTP ${response.status})`,
            { httpStatus: response.status }
        );
    }

    if (data?.status?.message === "success") {
        return {
            status: "success",
            amount: data.data?.my_ticket?.amount_baht,
            hash,
            raw: data,
        };
    }

    throw new VoucherError(
        data?.status?.code ?? "BAD_RESPONSE",
        data?.status?.message ?? `Unexpected response (HTTP ${response.status})`,
        { httpStatus: response.status }
    );
};

export default Voucher;

/*
 * Hybrid CommonJS export: keeps `require(pkg)(...)` working — the form every
 * released version documented — while also exposing the named exports that
 * `require(pkg).Voucher` and bundlers expect.
 */
module.exports = Voucher;
module.exports.Voucher = Voucher;
module.exports.VoucherError = VoucherError;
module.exports.default = Voucher;
