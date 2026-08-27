import { Timestamp } from 'firebase/firestore';
import { BaseModel } from '../base.model';
import { ImageModel } from '../utils/image.model';

export class HomePageImageModel extends BaseModel {
  isActive = false;
  order: number;
  image?: ImageModel;
  title: string;
  text?: string;
  ctaTitle?: string;
  ctaDestination?: string;
  ctaUrl?: string;
  date: Timestamp;

  /**
   * True when the SLIDE IMAGE already has its own headline drawn into it -
   * the Golf Tournament and Summit artwork, for example.
   *
   * Slider images are normally supposed to be text-free, because the template
   * draws `title`, `text` and the button over the lower-left. Some artwork
   * arrives with the headline baked in anyway, and then a visitor sees two
   * competing headlines at once.
   *
   * On phones and tablets a slide with this set renders the artwork clean:
   * no dark overlay dimming it and no site headline over it, just the whole
   * image and the call-to-action button. Desktop is unaffected - there the
   * frame is wide enough for the overlaid copy to sit clear of the artwork.
   *
   * Optional and absent on every existing record, which reads as false: the
   * behaviour only turns on for a slide somebody deliberately ticks.
   */
  artworkHasText?: boolean;
}
