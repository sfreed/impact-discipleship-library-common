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

  /**
   * An alternative picture for phones and tablets, used below 992px in place
   * of `image`. Optional - a slide without one shows `image` at every size,
   * exactly as before.
   *
   * Why a second file rather than more CSS: `image` is authored as a wide
   * desktop banner, 2560x1200 for the event slides. Fitting that whole banner
   * into a 390px phone is a 6.6x reduction, which leaves the wordmark inside
   * it too small to read; filling the phone frame instead crops half the
   * picture away. Neither is a styling problem - one image cannot serve both
   * shapes, so a slide that matters on a phone gets artwork cut for a phone.
   *
   * Near-square (about 5:4) suits the frame best: it fills a phone with almost
   * no letterboxing. See scripts/crop-slide-for-mobile.js, which cuts one from
   * an existing wide banner.
   */
  mobileImage?: ImageModel;
}
