import { Pipe, PipeTransform } from '@angular/core';
import { translate } from './language';
@Pipe({ name: 'tr', standalone: true })
export class TranslatePipe implements PipeTransform {
  transform(value: unknown, parameters: readonly unknown[] = []): string { return translate(value, parameters); }
}
