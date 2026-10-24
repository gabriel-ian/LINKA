import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorComponent, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';

/**
 * Editor de texto com formatacao (TinyMCE, hospedado pela propria Linka:
 * sem chave e sem enviar nada para fora). So oferece o que o servidor
 * aceita: negrito, italico, listas, titulos, citacao e links.
 */
@Component({
  selector: 'app-editor-texto',
  imports: [FormsModule, EditorComponent],
  providers: [{ provide: TINYMCE_SCRIPT_SRC, useValue: '/tinymce/tinymce.min.js' }],
  template: `
    <editor
      [init]="config()"
      [ngModel]="valor()"
      (ngModelChange)="valor.set($event)"
      [attr.aria-label]="rotulo()"
    />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class EditorTexto {
  readonly valor = model('');
  readonly rotulo = input('Texto');
  readonly placeholder = input('');
  readonly altura = input(260);
  /** Barra menor, para o aluno. */
  readonly simples = input(false);

  readonly config = () => ({
    license_key: 'gpl',
    base_url: '/tinymce',
    suffix: '.min',
    language: 'pt-BR',
    language_url: '/tinymce-i18n/pt-BR.js',
    height: this.altura(),
    menubar: false,
    branding: false,
    promotion: false,
    statusbar: false,
    placeholder: this.placeholder(),
    plugins: 'lists link autolink',
    toolbar: this.simples()
      ? 'bold italic underline | bullist numlist | undo redo'
      : 'blocks | bold italic underline strikethrough | bullist numlist | blockquote link | undo redo',
    block_formats: 'Parágrafo=p; Título=h2; Subtítulo=h3',
    link_default_target: '_blank',
    link_assume_external_targets: true,
    // So as tags que o servidor deixa passar; colar do Word nao traz estilos.
    valid_elements:
      'p,br,strong/b,em/i,u,s,ul,ol,li,h2,h3,blockquote,a[href|target=_blank|rel=noopener noreferrer]',
    paste_as_text: false,
    content_style:
      'body { font-family: Montserrat, sans-serif; font-size: 15px; color: #333; line-height: 1.5; }',
  });
}

/** O editor manda "<p></p>" quando vazio: confere se tem texto de verdade. */
export function temTexto(html: string): boolean {
  return (
    html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim().length > 0
  );
}
