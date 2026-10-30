import type { Metadata } from 'next';
import Workspace from './Workspace';

export const metadata: Metadata = {
  title: 'Aurum Estudio — Producción de contenido',
  robots: { index: false },
};

export default function ContenidoPage() {
  return <Workspace />;
}
