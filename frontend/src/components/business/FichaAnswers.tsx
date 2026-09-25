import { Negocio } from "@/types/strapi";
import { serializeJsonLd } from "@/lib/json-ld";
import { buildFichaAnswers } from "@/lib/aeo/ficha-answers";

export default function FichaAnswers({ negocio }: { negocio: Negocio }) {
  const { summary, faqs } = buildFichaAnswers(negocio);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <section
      data-testid="ficha-answers"
      className="mx-auto max-w-7xl border-t border-white/10 px-4 py-10 md:px-12 lg:px-16"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />
      <p className="max-w-3xl text-sm leading-relaxed text-slate-400">{summary}</p>
      <div className="mt-5 max-w-3xl space-y-3">
        {faqs.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-xl border border-white/10 bg-slate-900/40 p-4"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-200">
              {faq.q}
              <span className="flex-shrink-0 text-lg text-primary transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
