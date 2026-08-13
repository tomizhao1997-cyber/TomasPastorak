import type { Metadata } from 'next';

const EMAIL = 'tom_y_97@hotmail.com';
const WHATSAPP_DISPLAY = '+54 9 11 4192 9388';
const WHATSAPP_LINK = 'https://wa.me/5491141929388';

type Project = {
  title: string;
  description: string;
  tags: string[];
};

const PROJECTS: Project[] = [
  {
    title: 'Pueblo Caamaño',
    description:
      'Plataforma SaaS de tres modos (compradores, residentes, admin). Real-time sync, row-level security y control de acceso por roles.',
    tags: ['React', 'Next.js', 'Supabase', 'TypeScript'],
  },
  {
    title: 'WhatsApp / Instagram Chatbot',
    description:
      'Bot de atención al cliente en producción: consultas, pedidos y seguimiento de estado. 100+ interacciones diarias, respuesta de 2 h → 5 min.',
    tags: ['Node.js', 'Claude API', 'Supabase'],
  },
  {
    title: 'AI Content Pipeline',
    description:
      'Pipeline end-to-end de producción de video: guiones con Claude, generación de video con IA y síntesis de voz. Producción de 2 semanas → 3 días.',
    tags: ['Claude API', 'ElevenLabs', 'Python'],
  },
  {
    title: 'Zhao Admin Panel',
    description:
      'Panel interno para una cadena de restaurantes de 4 locales: inventario, ventas y reportes multi-local en tiempo real.',
    tags: ['React', 'Supabase', 'PostgreSQL'],
  },
  {
    title: 'Marketing Asset Generator',
    description:
      'Generación automática de 100+ piezas gráficas con cumplimiento de brand guidelines. De 20 hs/semana → 2 hs.',
    tags: ['Python', 'Pillow', 'Automation'],
  },
];

const SKILLS: { heading: string; items: string[] }[] = [
  {
    heading: 'Backend',
    items: ['Node.js', 'Python', 'Express', 'REST APIs', 'WebSockets'],
  },
  {
    heading: 'Frontend',
    items: ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Vercel'],
  },
  {
    heading: 'Data & AI',
    items: [
      'Claude API',
      'Supabase',
      'PostgreSQL',
      'Prompt Engineering',
      'n8n',
      'Arquitecturas con agentes',
    ],
  },
];

export const metadata: Metadata = {
  title: 'Tomás Pastorak — AI Product Engineer / Full Stack Developer',
};

export default function Home() {
  return (
    <main className="relative min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-28 sm:pt-36">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Buenos Aires, Argentina — Remote
          </p>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            I build production systems with{' '}
            <span className="gradient-accent">Claude API, React and Node.js.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            Tomás Pastorak · AI Product Engineer / Full Stack Developer. Dos años
            shippeando apps con Claude Code como entorno principal de desarrollo.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${EMAIL}`}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
            >
              Get in touch
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/90 transition-colors hover:border-white/30 hover:bg-white/10"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Selected work
          </h2>
          <span className="font-mono text-xs text-white/40">05 projects</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {PROJECTS.map((project) => (
            <article
              key={project.title}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
            >
              <h3 className="text-lg font-semibold tracking-tight">
                {project.title}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-white/55">
                {project.description}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-white/60"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-10 text-2xl font-bold tracking-tight sm:text-3xl">
          Skills
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {SKILLS.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-white/40">
                {group.heading}
              </h3>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item} className="text-sm text-white/75">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / Contact */}
      <footer className="mt-8 border-t border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              Let&apos;s build something.
            </p>
            <p className="mt-1 text-sm text-white/50">
              Buenos Aires, Argentina — Remote
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <a
              href={`mailto:${EMAIL}`}
              className="text-sm text-white/75 transition-colors hover:text-white"
            >
              {EMAIL}
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/75 transition-colors hover:text-white"
            >
              {WHATSAPP_DISPLAY}
            </a>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-6 pb-10">
          <p className="font-mono text-xs text-white/30">
            © {new Date().getFullYear()} Tomás Pastorak
          </p>
        </div>
      </footer>
    </main>
  );
}
