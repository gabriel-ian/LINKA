import { Pipe, PipeTransform } from '@angular/core';

/** {{ n | plural: 'aluno' : 'alunos' }} -> "1 aluno", "3 alunos". */
@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(n: number | null | undefined, um: string, varios: string): string {
    const valor = n ?? 0;
    return `${valor} ${valor === 1 ? um : varios}`;
  }
}
