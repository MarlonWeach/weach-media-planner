import { redirect } from 'next/navigation';

export default function VisualizarCotacaoPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/cotacao/${params.id}/editar`);
}
