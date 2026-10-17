/** Cores das barras de materia no Figma (texto, barra), em ordem. */
const CORES_MATERIA = [
  { texto: '#059669', barra: '#059669' },
  { texto: '#1558d6', barra: '#1558d6' },
  { texto: '#f2620f', barra: '#f2620f' },
  { texto: '#9747ff', barra: '#7c3aed' },
];

export function corMateria(indice: number): { texto: string; barra: string } {
  return CORES_MATERIA[indice % CORES_MATERIA.length];
}

/** "Hoje - 9h00", "Ontem - 14h00", "4 dias atrás", "12/05". */
export function quandoFoi(data: string | Date, agora = new Date()): string {
  const d = new Date(data);
  const hora = `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
  const meiaNoite = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((meiaNoite(agora) - meiaNoite(d)) / 86_400_000);
  if (dias <= 0) return `Hoje - ${hora}`;
  if (dias === 1) return `Ontem - ${hora}`;
  if (dias < 7) return `${dias} dias atrás`;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
