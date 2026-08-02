import { DiscussionGroup } from '../models/discussion-group.model';
import { countryNameByCode } from './data/countries';

/** Single place that reconciles the structured `location` shape (respecting
 *  `addressVisible`) against the legacy free-text `inPersonLocation` string,
 *  used identically by every "location chip"/table-cell render site across
 *  both apps so a hidden address can never leak into the UI from one place
 *  while staying hidden in another. Returns undefined for online-only
 *  groups (nothing to show). Pass `alwaysShowAddress: true` for admin/staff
 *  views that should see the real address regardless of `addressVisible`. */
export function groupLocationLabel(group: DiscussionGroup, options?: { alwaysShowAddress?: boolean }): string | undefined {
  const loc = group.location;
  if (loc) {
    const parts: string[] = [];
    if ((loc.addressVisible || options?.alwaysShowAddress) && loc.address1) {
      parts.push(loc.address1);
    }
    parts.push(loc.city);
    if (loc.state) {
      parts.push(loc.state);
    }
    if (loc.country !== 'US') {
      parts.push(countryNameByCode(loc.country) ?? loc.country);
    }
    return parts.join(', ');
  }
  return group.inPersonLocation;
}
