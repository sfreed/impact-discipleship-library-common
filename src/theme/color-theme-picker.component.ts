// Reusable Color Theme dropdown - extracted from
// impact-discipleship-library-new's settings.component.html/.ts so both apps'
// Settings pages can drop in the same swatch-preview mat-select instead of
// each hand-rolling the template. Dumb/presentational: the host page owns the
// actual ThemeService (each app's own BaseThemeService subclass) and passes
// the current value/mode in, receiving the new value back via (valueChange).

import { Component, computed, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { DARK_COLOR_THEMES, LIGHT_COLOR_THEMES } from './base-theme.service';

@Component({
  selector: 'lib-color-theme-picker',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, TitleCasePipe],
  templateUrl: './color-theme-picker.component.html',
  styleUrl: './color-theme-picker.component.scss',
})
export class ColorThemePickerComponent {
  readonly value = input.required<string>();
  readonly darkMode = input.required<boolean>();
  readonly valueChange = output<string>();

  /** Which catalog to show - swaps immediately when the host's dark-mode
   *  input changes. */
  readonly options = computed(() => (this.darkMode() ? DARK_COLOR_THEMES : LIGHT_COLOR_THEMES));

  onSelectionChange(event: MatSelectChange): void {
    this.valueChange.emit(event.value);
  }

  /** Classes for a given catalog id's preview swatch (see .theme-swatch in
   *  _theme-palettes.scss) - 'default' needs no theme-{id} class (it's the
   *  unmodified base theme), and every dark-catalog swatch also needs
   *  'dark-theme' itself (not just an ancestor), since the dark theme-*
   *  rules require both classes on the same element. */
  swatchClasses(id: string): string {
    const themeClass = id === 'default' ? '' : `theme-${id}`;
    return [themeClass, this.darkMode() ? 'dark-theme' : ''].filter(Boolean).join(' ');
  }
}
