import { Pipe, type PipeTransform } from '@angular/core';
import type { Token } from '../interface/token/token.interface.ts';

@Pipe({
  name: 'token',
})
export class TokenPipe implements PipeTransform {
  transform(value: readonly string[], ...args: unknown[]): readonly Token[] {
    return value.map((character, id) => ({ id, character }));
  }
}
