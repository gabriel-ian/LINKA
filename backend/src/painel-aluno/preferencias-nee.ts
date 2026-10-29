import { PREFERENCIAS_PADRAO, PreferenciasAluno } from '../aluno/aluno.entity';

/** Ajudas que cada diagnostico liga de inicio (o aluno pode mudar no perfil). */
const POR_DIAGNOSTICO: [RegExp, Partial<PreferenciasAluno>][] = [
  [/tdah/i, { passosCurtos: true, tempoPasso: true }],
  [/tea|autis/i, { passosCurtos: true, modoCalmo: true }],
  [/dislexia/i, { ouvirVoz: true, fonteDislexia: true, reguaLeitura: true }],
  [/discalculia/i, { passosCurtos: true, ouvirVoz: true }],
  [
    /visual/i,
    {
      ouvirVoz: true,
      letrasMaiores: true,
      tamanhoLetra: 2,
      altoContraste: true,
    },
  ],
  [/auditiva|surd/i, { ouvirVoz: false }],
];

/**
 * Preferencias sugeridas pelo diagnostico, para o aluno que ainda nao mexeu
 * no proprio perfil. Quem nao ouve nao recebe leitura em voz alta, mesmo
 * com outro diagnostico que a ligaria.
 */
export function preferenciasSugeridas(
  diagnosticos: string[],
): Partial<PreferenciasAluno> {
  const sugeridas: Partial<PreferenciasAluno> = {};
  for (const [padrao, prefs] of POR_DIAGNOSTICO)
    if (diagnosticos.some((d) => padrao.test(d)))
      for (const [chave, valor] of Object.entries(prefs))
        if (chave !== 'ouvirVoz' || sugeridas.ouvirVoz !== false)
          Object.assign(sugeridas, { [chave]: valor });
  return sugeridas;
}

/**
 * As ajudas do diagnostico como um interruptor no perfil: `ligado` aplica as
 * sugeridas e `desligado` volta cada uma ao padrao. Null sem nada sugerido.
 */
export function ajudasSugeridas(diagnosticos: string[]): {
  ligado: Partial<PreferenciasAluno>;
  desligado: Partial<PreferenciasAluno>;
} | null {
  const ligado = preferenciasSugeridas(diagnosticos);
  const chaves = Object.keys(ligado) as (keyof PreferenciasAluno)[];
  if (!chaves.length) return null;
  const desligado = Object.fromEntries(
    chaves.map((c) => [c, PREFERENCIAS_PADRAO[c]]),
  ) as Partial<PreferenciasAluno>;
  return { ligado, desligado };
}
