import type { Metadata } from 'next';
import Workspace from './Workspace';

export const metadata: Metadata = {
  title: 'Producción de contenido — Zhao',
  robots: { index: false },
};

export default function ContenidoPage() {
  return <Workspace />;
}
