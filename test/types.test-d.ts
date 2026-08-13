/**
 * Compile-only check that the shipped types are actually usable by consumers.
 * Nothing here runs — `npm run typecheck` fails the build if the surface drifts.
 */
import Voucher, { Voucher as Named, VoucherError, VoucherOptions, VoucherResult } from "../index";

export async function readmeExample(): Promise<void> {
    try {
        const result: VoucherResult = await Voucher("0123456789", "ลิ้งค์อั่งเปา หรือ โค้ดอั่งเปา");
        console.log(`สถานะ: ${result.status} | จำนวน: ${result.amount} บาท`);
    } catch (error) {
        if (error instanceof VoucherError) {
            const code: string = error.code;
            const httpStatus: number | undefined = error.httpStatus;
            const indeterminate: boolean = error.indeterminate;
            console.log(code, httpStatus, indeterminate);
        }
    }
}

/** Default and named exports must be the same callable. */
export const sameFunction: typeof Voucher = Named;

/** Every option is optional, and accepts what the README says it does. */
export const options: VoucherOptions = {
    timeout: 5000,
    signal: AbortSignal.timeout(9000),
    fetch: globalThis.fetch,
};

export const withOptions = () => Voucher("0123456789", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", options);
export const withoutOptions = () => Voucher("0123456789", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

// @ts-expect-error mobile is required
export const missingArgs = () => Voucher();

// @ts-expect-error result fields are read from a typed shape, not `any`
export const badField = async () => (await withoutOptions()).nonExistentField;
