import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'split',
})
export class SplitPipe implements PipeTransform {
  transform(value: string, ...args: unknown[]): readonly string[] {
    return [...value];
  }
}
