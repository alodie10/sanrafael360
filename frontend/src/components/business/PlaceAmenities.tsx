"use client";

import { useState } from "react";
import { Atributo } from "@/types/strapi";
import { amenityIcon } from "./place-amenity-icons";
import styles from "./PlaceAmenities.module.css";

const PREVIEW = 10;

export default function PlaceAmenities({ atributos }: { atributos?: Atributo[] }) {
  const items = (atributos || [])
    .filter((item) => item.tipo === "facilidad")
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  const visible = open ? items : items.slice(0, PREVIEW);

  return (
    <section className={styles.section} data-testid="place-amenities">
      <h3 className={styles.title}>Lo que ofrece este lugar</h3>
      <ul className={styles.grid}>
        {visible.map((item) => {
          const Icon = amenityIcon(item.icono);
          return (
            <li key={item.documentId || item.nombre} className={styles.item}>
              <Icon className={styles.icon} aria-hidden="true" />
              <span>{item.nombre}</span>
            </li>
          );
        })}
      </ul>
      {items.length > PREVIEW ? (
        <button
          type="button"
          className={styles.more}
          data-testid="place-amenities-more"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Mostrar menos" : "Mostrar todos"}
        </button>
      ) : null}
    </section>
  );
}
