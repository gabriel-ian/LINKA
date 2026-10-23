import { existsSync, unlinkSync } from 'fs';
import { ADMIN, ARQUIVO_ESTADO, api, entrar, lerEstado } from './api';
import { limparEscolasDeTeste } from './limpar';

/**
 * Desativa a escola de teste e, se conseguir falar com o banco (backend/.env
 * ou variaveis DB_*), apaga de vez tudo o que os testes criaram.
 */
export default async function globalTeardown(): Promise<void> {
  if (existsSync(ARQUIVO_ESTADO)) {
    const { escola } = lerEstado();
    const adm = await entrar(ADMIN.email, ADMIN.senha);
    await api('DELETE', `/admin/escolas/${escola.id}`, adm).catch(() => undefined);
    unlinkSync(ARQUIVO_ESTADO);
  }
  await limparEscolasDeTeste().catch((e: unknown) =>
    console.warn('Escolas de teste ficaram desativadas (sem acesso ao banco):', String(e)),
  );
}
