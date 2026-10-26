import { describe, expect, it } from 'vitest';
import { iconePasso } from './aluno-ui';

describe('iconePasso', () => {
  it('escolhe a figura pelo que o passo pede', () => {
    expect(iconePasso('Separe o livro e o caderno.')?.emoji).toBe('🎒');
    expect(iconePasso('Leia o capítulo 3 com atenção.')?.emoji).toBe('📖');
    expect(iconePasso('Resolva os exercícios 1 a 4.')?.emoji).toBe('🔢');
    expect(iconePasso('Anote quem é o personagem principal.')?.emoji).toBe('✏️');
    expect(iconePasso('Revise suas respostas.')?.emoji).toBe('✅');
    expect(iconePasso('Desenhe o ciclo da água.')?.emoji).toBe('🎨');
  });

  it('nao inventa figura quando nao reconhece o passo', () => {
    expect(iconePasso('Lembre do que a professora falou.')).toBeNull();
  });
});
