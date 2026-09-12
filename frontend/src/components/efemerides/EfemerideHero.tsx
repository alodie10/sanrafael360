import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import { formatCalendarDate } from "@/lib/calendar-date";
import type { EfemeridePublic, ParticipanteExterno, StrapiMedia } from "@/types/strapi";
import FeriaParticipantesList from "@/components/efemerides/FeriaParticipantesList";
import FeriaRosterScroll from "@/components/efemerides/FeriaRosterScroll";
import styles from "./EfemerideHero.module.css";

function coverOrientation(media?: StrapiMedia | null, tipo?: string) {
  const width = media?.width || 0;
  const height = media?.height || 0;
  if (width > 0 && height > 0) return height >= width ? "portrait" : "landscape";
  return tipo === "feria" ? "portrait" : "landscape";
}

function HeroAmbient({ src }: { src: string }) {
  return (
    <>
      <div className={styles.ambient} aria-hidden>
        <div className={styles.ambientInner}>
          <Image
            src={optimizeCloudinaryUrl(src, "c_fill,w_900,h_1200,q_auto,f_auto")}
            alt=""
            fill
            sizes="100vw"
            className={styles.ambientImg}
            priority
          />
        </div>
      </div>
      <div className={styles.veil} />
    </>
  );
}

function HeroPoster({
  src,
  alt,
  width,
  height,
  sizes,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
}) {
  return (
    <figure
      className={styles.poster}
      data-testid="efemeride-poster"
      style={
        {
          "--poster-w": String(width),
          "--poster-h": String(height),
        } as CSSProperties
      }
    >
      <Image
        src={optimizeCloudinaryUrl(src, "c_limit,w_1400,q_auto,f_auto")}
        alt={alt}
        fill
        sizes={sizes}
        className={styles.posterImg}
        priority
      />
    </figure>
  );
}

function HeroCopy({
  isFeria,
  nombre,
  descripcion,
  hastaLabel,
  children,
}: {
  isFeria: boolean;
  nombre: string;
  descripcion?: string | null;
  hastaLabel: string | null;
  children?: ReactNode;
}) {
  return (
    <div className={styles.copy}>
      <div className={styles.copyMain}>
        <p className={styles.kicker}>{isFeria ? "Feria" : "Efeméride"}</p>
        <h1 className={styles.title}>
          {nombre} en <span className={styles.accent}>San Rafael</span>
        </h1>
      </div>
      {(descripcion || hastaLabel) && (
        <div className={styles.copyMeta}>
          {descripcion && <p className={styles.lead}>{descripcion}</p>}
          {hastaLabel && <p className={styles.until}>Vigente hasta {hastaLabel}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function FeriaRoster({ items }: { items: ParticipanteExterno[] }) {
  return (
    <div className={styles.roster} id="participantes">
      <div className={styles.rosterHead}>
        <h2 className={styles.rosterTitle}>
          Quiénes participan
          {items.length > 0 && (
            <span className={styles.rosterCount}>
              {" "}
              · {items.length} {items.length === 1 ? "emprendimiento" : "emprendimientos"}
            </span>
          )}
        </h2>
      </div>
      <FeriaRosterScroll>
        <FeriaParticipantesList items={items} variant="rail" />
      </FeriaRosterScroll>
    </div>
  );
}

export default function EfemerideHero({ efemeride }: { efemeride: EfemeridePublic }) {
  const isFeria = efemeride.tipo === "feria";
  const coverUrl = efemeride.encabezado?.url ? getStrapiMedia(efemeride.encabezado.url) : null;
  const orientation = coverOrientation(efemeride.encabezado, efemeride.tipo);
  const hastaLabel = efemeride.vigente_hasta
    ? formatCalendarDate(efemeride.vigente_hasta, { day: "numeric", month: "long" })
    : null;
  const posterW = efemeride.encabezado?.width || (orientation === "portrait" ? 9 : 16);
  const posterH = efemeride.encabezado?.height || (orientation === "portrait" ? 16 : 9);

  return (
    <section
      className={styles.hero}
      data-orientation={orientation}
      data-testid="efemeride-hero"
    >
      {coverUrl && <HeroAmbient src={coverUrl} />}
      {!coverUrl && <div className={styles.veil} />}

      <div className={styles.inner}>
        <Link href="/" className={styles.back}>
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
        <div className={styles.stage}>
          {coverUrl && (
            <HeroPoster
              src={coverUrl}
              alt={efemeride.nombre}
              width={posterW}
              height={posterH}
              sizes={
                orientation === "landscape"
                  ? "(min-width: 900px) 920px, 100vw"
                  : "(min-width: 900px) 420px, 90vw"
              }
            />
          )}
          <HeroCopy
            isFeria={isFeria}
            nombre={efemeride.nombre}
            descripcion={efemeride.descripcion}
            hastaLabel={hastaLabel}
          >
            {isFeria && <FeriaRoster items={efemeride.participantes_externos || []} />}
          </HeroCopy>
        </div>
      </div>
    </section>
  );
}
