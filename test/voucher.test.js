const test = require("node:test");
const assert = require("node:assert/strict");
const Voucher = require("../index.js");
const { VoucherError } = Voucher;

const HASH = "abcdefghijklmnopqrstuvwxyz012345678"; // 35 chars
const LINK = `https://gift.truemoney.com/campaign/?v=${HASH}`;
const MOBILE = "0812345678";

/** A fetch stub that records its call and replies with the given body. */
const stub = (body, init = {}) => {
    const calls = [];
    const fn = async (url, opts) => {
        calls.push({ url, opts });
        return new Response(body, init);
    };
    fn.calls = calls;
    return fn;
};

const json = (obj, status = 200) =>
    stub(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

const SUCCESS = { status: { message: "success", code: "SUCCESS" }, data: { my_ticket: { amount_baht: "10.00" } } };

/** Assert `fn` rejects with a VoucherError carrying `code`. */
const rejectsWith = async (fn, code) => {
    await assert.rejects(fn, (err) => {
        assert.ok(err instanceof VoucherError, `expected VoucherError, got ${err?.name}`);
        assert.equal(err.code, code);
        return true;
    });
};

test("exports", async (t) => {
    await t.test("module itself is callable", () => assert.equal(typeof Voucher, "function"));
    await t.test("named export matches", () => assert.equal(Voucher.Voucher, Voucher));
    await t.test("default export matches", () => assert.equal(Voucher.default, Voucher));
    await t.test("VoucherError is exported", () => assert.equal(typeof VoucherError, "function"));
});

test("argument validation", async (t) => {
    const fetch = json(SUCCESS);

    await t.test("rejects empty mobile", () => rejectsWith(() => Voucher("", LINK, { fetch }), "MISSING_ARGUMENT"));
    await t.test("rejects empty voucher", () => rejectsWith(() => Voucher(MOBILE, "", { fetch }), "MISSING_ARGUMENT"));
    await t.test("rejects undefined args", () =>
        rejectsWith(() => Voucher(undefined, undefined, { fetch }), "MISSING_ARGUMENT"));
    await t.test("rejects non-string args", () => rejectsWith(() => Voucher(123, LINK, { fetch }), "MISSING_ARGUMENT"));
    await t.test("rejects short mobile", () => rejectsWith(() => Voucher("081234", LINK, { fetch }), "INVALID_MOBILE"));
    await t.test("rejects mobile with letters", () =>
        rejectsWith(() => Voucher("08123456ab", LINK, { fetch }), "INVALID_MOBILE"));
    await t.test("rejects wrong-length hash", () =>
        rejectsWith(() => Voucher(MOBILE, "tooshort", { fetch }), "INVALID_VOUCHER"));
    await t.test("rejects hash with no alphanumerics", () =>
        rejectsWith(() => Voucher(MOBILE, "!!!???", { fetch }), "INVALID_VOUCHER"));

    await t.test("no request is made when validation fails", () => assert.equal(fetch.calls.length, 0));
});

test("hash extraction", async (t) => {
    await t.test("pulls the hash out of a campaign link", async () => {
        const fetch = json(SUCCESS);
        const result = await Voucher(MOBILE, LINK, { fetch });
        assert.equal(result.hash, HASH);
        assert.equal(fetch.calls[0].url, `https://gift.truemoney.com/campaign/vouchers/${HASH}/redeem`);
    });

    await t.test("accepts a bare hash", async () => {
        const fetch = json(SUCCESS);
        const result = await Voucher(MOBILE, HASH, { fetch });
        assert.equal(result.hash, HASH);
    });

    await t.test("sends mobile and hash in the body", async () => {
        const fetch = json(SUCCESS);
        await Voucher(MOBILE, LINK, { fetch });
        assert.deepEqual(JSON.parse(fetch.calls[0].opts.body), { mobile: MOBILE, voucher_hash: HASH });
        assert.equal(fetch.calls[0].opts.method, "POST");
    });
});

test("success response", async (t) => {
    const result = await Voucher(MOBILE, LINK, { fetch: json(SUCCESS) });

    await t.test("reports success", () => assert.equal(result.status, "success"));
    await t.test("passes the amount through", () => assert.equal(result.amount, "10.00"));
    await t.test("returns the hash", () => assert.equal(result.hash, HASH));
    await t.test("exposes the raw payload", () => assert.deepEqual(result.raw, SUCCESS));
});

test("upstream API errors", async (t) => {
    await t.test("passes the upstream code through", () =>
        rejectsWith(
            () =>
                Voucher(MOBILE, LINK, {
                    fetch: json({ status: { message: "Voucher doesn't exist.", code: "VOUCHER_NOT_FOUND" } }, 400),
                }),
            "VOUCHER_NOT_FOUND"
        ));

    await t.test("keeps the upstream message and http status", async () => {
        await assert.rejects(
            () =>
                Voucher(MOBILE, LINK, {
                    fetch: json({ status: { message: "Voucher doesn't exist.", code: "VOUCHER_NOT_FOUND" } }, 400),
                }),
            (err) => {
                assert.equal(err.message, "Voucher doesn't exist.");
                assert.equal(err.httpStatus, 400);
                assert.equal(err.indeterminate, false);
                return true;
            }
        );
    });

    await t.test("handles a payload with no status object", () =>
        rejectsWith(() => Voucher(MOBILE, LINK, { fetch: json({ unexpected: true }, 500) }), "BAD_RESPONSE"));
});

test("non-JSON responses", async (t) => {
    await t.test("403 HTML is reported as REQUEST_BLOCKED", () =>
        rejectsWith(
            () =>
                Voucher(MOBILE, LINK, {
                    fetch: stub("<!DOCTYPE html><title>Attention Required! | Cloudflare</title>", {
                        status: 403,
                        headers: { "content-type": "text/html" },
                    }),
                }),
            "REQUEST_BLOCKED"
        ));

    await t.test("other HTML is reported as BAD_RESPONSE", () =>
        rejectsWith(
            () =>
                Voucher(MOBILE, LINK, {
                    fetch: stub("<html>502 Bad Gateway</html>", {
                        status: 502,
                        headers: { "content-type": "text/html" },
                    }),
                }),
            "BAD_RESPONSE"
        ));

    await t.test("does not throw a raw TypeError on garbage", async () => {
        await assert.rejects(
            () => Voucher(MOBILE, LINK, { fetch: stub("", { status: 200 }) }),
            (err) => {
                assert.ok(err instanceof VoucherError);
                return true;
            }
        );
    });
});

test("transport failures are flagged indeterminate", async (t) => {
    await t.test("network error", async () => {
        const fetch = async () => {
            throw new TypeError("fetch failed");
        };
        await assert.rejects(
            () => Voucher(MOBILE, LINK, { fetch }),
            (err) => {
                assert.equal(err.code, "NETWORK_ERROR");
                assert.equal(err.indeterminate, true, "caller must be able to detect an unknown outcome");
                return true;
            }
        );
    });

    await t.test("timeout", async () => {
        const fetch = (url, opts) =>
            new Promise((_, reject) => opts.signal.addEventListener("abort", () => reject(opts.signal.reason)));
        await assert.rejects(
            () => Voucher(MOBILE, LINK, { fetch, timeout: 20 }),
            (err) => {
                assert.equal(err.code, "TIMEOUT");
                assert.equal(err.indeterminate, true);
                return true;
            }
        );
    });

    await t.test("caller's signal can cancel", async () => {
        const controller = new AbortController();
        const fetch = (url, opts) =>
            new Promise((_, reject) => opts.signal.addEventListener("abort", () => reject(opts.signal.reason)));
        const pending = Voucher(MOBILE, LINK, { fetch, signal: controller.signal });
        controller.abort();
        await assert.rejects(pending, (err) => {
            assert.ok(err instanceof VoucherError);
            return true;
        });
    });
});
