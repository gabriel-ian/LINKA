import { Component } from '@angular/core';

/**
 * Versao do termo. Precisa ser igual a TERMO_VERSAO do backend
 * (backend/src/lgpd/lgpd.service.ts): mudou o texto, sobe as duas.
 */
export const TERMO_VERSAO = '2026-10';

/**
 * Termo de uso e privacidade da Linka (LGPD), mostrado em /privacidade e no
 * aceite da familia.
 *
 * RASCUNHO: revisar com o juridico/encarregado de dados antes de publicar.
 */
@Component({
  selector: 'app-termo-texto',
  template: `
    <article class="termo">
      <p class="versao">Versão {{ versao }}</p>

      <h2>1. O que é a Linka</h2>
      <p>
        A Linka é uma plataforma usada pela escola do seu filho(a) para adaptar tarefas a alunos com
        necessidades educacionais especiais e para a família acompanhar a rotina escolar. A escola é
        a responsável pelos dados (controladora) e a Linka os trata em nome dela (operadora).
      </p>

      <h2>2. Quais dados usamos</h2>
      <ul>
        <li>Do aluno: nome, data de nascimento, CGM, turma, tarefas e o andamento delas.</li>
        <li>
          Dados de saúde, quando a escola informa: diagnósticos (TDAH, TEA, dislexia...), perfil de
          aprendizagem e o laudo clínico. São dados sensíveis e recebem cuidado especial.
        </li>
        <li>Da família: nome, e-mail, telefone, parentesco e as mensagens de incentivo.</li>
      </ul>

      <h2>3. Para que usamos</h2>
      <ul>
        <li>Adaptar as tarefas ao jeito de aprender de cada aluno.</li>
        <li>Mostrar à escola, ao professor e à família o progresso do aluno.</li>
        <li>Enviar avisos e resumos por e-mail que a família escolher receber.</li>
      </ul>
      <p>Não vendemos dados e não usamos os dados para publicidade.</p>

      <h2>4. Inteligência artificial</h2>
      <p>
        Para adaptar uma tarefa, a Linka envia a um serviço de IA apenas o primeiro nome, a idade,
        os diagnósticos e os interesses do aluno. Nunca enviamos CGM, laudo, e-mail ou o nome
        completo.
      </p>

      <h2>5. Quem vê os dados</h2>
      <ul>
        <li>A escola do aluno vê tudo, inclusive o laudo.</li>
        <li>Os professores das turmas do aluno veem o perfil de aprendizagem, não o laudo.</li>
        <li>A família vê os dados dos próprios filhos.</li>
      </ul>
      <p>Cada envio e cada download do laudo ficam registrados (quem e quando).</p>

      <h2>6. Seus direitos</h2>
      <p>
        Você pode, a qualquer momento, pelas Configurações do painel da família: baixar uma cópia de
        todos os dados do seu filho(a) e pedir a exclusão desses dados. A exclusão é feita pela
        escola; depois dela fica só um registro anônimo, sem nome nem dados de saúde, para as
        estatísticas da turma.
      </p>

      <h2>7. Segurança e guarda</h2>
      <p>
        O acesso é feito com login e senha, e os laudos ficam fora do alcance público. Os dados são
        guardados enquanto a escola usar a Linka, até que a família peça a exclusão.
      </p>

      <h2>8. Contato</h2>
      <p>
        Dúvidas ou pedidos sobre seus dados: fale com a coordenação da escola, que é a responsável
        pelo tratamento.
      </p>
    </article>
  `,
  styles: `
    .termo {
      font-size: 15px;
      line-height: 1.55;
    }
    .versao {
      margin: 0 0 8px;
      font-size: 13px;
      color: var(--cor-texto);
    }
    h2 {
      margin: 20px 0 6px;
      font-size: 17px;
    }
    p,
    ul {
      margin: 0 0 8px;
    }
    ul {
      padding-left: 20px;
    }
  `,
})
export class TermoTexto {
  readonly versao = TERMO_VERSAO;
}
