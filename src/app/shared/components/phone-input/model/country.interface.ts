import { CountryCode } from "libphonenumber-js";

export interface Country {
    name: string;
    dialCode: string;
    code: CountryCode;
    flag: string;
    mask: string;
}