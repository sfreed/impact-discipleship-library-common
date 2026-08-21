import { PHONE_TYPES } from "../../../lists/phone_types.enum";

export class Phone {
    countryCode: string;
    number: string;
    extension: string;
    type: PHONE_TYPES;
}
