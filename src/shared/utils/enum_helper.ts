import { Countries } from "../lists/countries.enum";
import { PHONE_TYPES } from "../lists/phone_types.enum";
import { States } from "../lists/states.enum";
import { TESTIMONIAL_TYPES } from "../lists/testimonial_types.enum";
import { UNIT_OF_MEASURE } from "../lists/unit_of_measure.enum";

export class EnumHelper {
  // Both are STRING enums, so Object.values() is exactly the keys-then-
  // lookup this used to do (a numeric enum would also carry its reverse
  // mappings and need the old form).
  static getPhoneTypesAsArray(): PHONE_TYPES[] {
    return Object.values(PHONE_TYPES);
  }

  static getTestimonialTypesAsArray(): TESTIMONIAL_TYPES[] {
    return Object.values(TESTIMONIAL_TYPES);
  }

  static getStateTypesAsArray(): string[] {
    return Object.values(States) as [];
  }

  // Unlike the other getters above, these return [key, value] pairs (e.g.
  // ["CA", "California"]) rather than just values - callers need both the
  // 2-letter code (to store) and the full name (to display).
  static getState2LetterTypesAsArray(): [string, string][] {
    return Object.entries(States);
  }

  static getCountryTypesAsArray(): string[] {
    return Object.values(Countries) as [];
  }

  static getCountry2LetterTypesAsArray(): [string, string][] {
    return Object.entries(Countries);
  }

  static getUOMTypesAsArray(): string[] {
    return Object.values(UNIT_OF_MEASURE) as [];
  }
}
