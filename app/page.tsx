"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const LEAD_WEBHOOK_URL = process.env.NEXT_PUBLIC_LEAD_WEBHOOK_URL;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CENTER_NAME = "JFG Clinic";
const CITY_NAME = "Orvault";
const CENTER_DISPLAY = `${CENTER_NAME} ${CITY_NAME}`;

const zones = [
  "Aisselles",
  "Maillot",
  "Jambes complètes",
  "Demi-jambes",
  "Bras",
  "Visage",
  "Dos / torse",
  "Plusieurs zones",
];

const faq = [
  {
    question: "1 zone achetée = 1 zone offerte, c’est vrai ?",
    answer:
      "Oui. Pour une zone achetée, une seconde zone vous est offerte. Le détail est validé pendant le bilan, selon les zones choisies.",
  },
  {
    question: "Le bilan et le test sont-ils vraiment offerts ?",
    answer:
      "Oui. Bilan et test laser offerts, sans engagement. Vous voyez si le protocole vous convient avant de vous lancer.",
  },
  {
    question: "Y a-t-il un engagement ?",
    answer:
      "Non. Le bilan et le test sont offerts sans engagement. L’offre 1 zone achetée = 1 zone offerte vous est détaillée pendant le rendez-vous.",
  },
  {
    question: "Combien de séances faut-il prévoir ?",
    answer:
      "Cela dépend de la zone, du type de peau et du poil. Le bilan sert justement à estimer le protocole adapté.",
  },
  {
    question: "Puis-je traiter plusieurs zones ?",
    answer:
      "Oui, vous pouvez cocher plusieurs zones. Pendant le bilan, l’équipe applique l’offre 1 zone achetée = 1 zone offerte.",
  },
  {
    question: "L’offre est-elle limitée ?",
    answer:
      "Oui. Offre limitée et exclusive, le temps de l’opération.",
  },
];

const beforeAfter = [
  {
    area: "Irritations",
    result: "Peau plus nette après protocole",
    src: "/before-after-irritations.jpg",
  },
  {
    area: "Aisselles",
    result: "Moins de poils visibles au quotidien",
    src: "/before-after-aisselles.jpg",
  },
  {
    area: "Dos",
    result: "Réduction visible sur grande zone",
    src: "/before-after-dos.jpg",
  },
  {
    area: "Aisselles",
    result: "Zone plus propre et plus homogène",
    src: "/before-after-epaules.jpg",
  },
  {
    area: "Jambe",
    result: "Routine rasage fortement réduite",
    src: "/before-after-jambe.jpg",
  },
];

const reviewFrames = [
  { name: "Stéphanie Rodier", src: "/jfg-review-1.jpg" },
  { name: "Pierre Farge", src: "/jfg-review-2.jpg" },
  { name: "Joëlle Jouandane", src: "/jfg-review-3.jpg" },
  { name: "Céline Clément", src: "/jfg-review-4.jpg" },
];

function track(eventName: string, params?: Record<string, unknown>) {
  window.fbq?.("track", eventName, params);
}

function getTrackingParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
    utm_content: params.get("utm_content") ?? "",
    utm_term: params.get("utm_term") ?? "",
    fbclid: params.get("fbclid") ?? "",
    meta_campaign_id: params.get("campaign_id") ?? "",
    meta_adset_id: params.get("adset_id") ?? "",
    meta_ad_id: params.get("ad_id") ?? "",
  };
}

export default function Home() {
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [step, setStep] = useState<"intro" | "form" | "thanks">("intro");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageOptIn, setMessageOptIn] = useState("oui");
  const trackingParams = useMemo(getTrackingParams, []);

  useEffect(() => {
    if (!META_PIXEL_ID || typeof window === "undefined" || window.fbq) return;

    const fbq = function (...args: unknown[]) {
      (
        fbq as unknown as {
          callMethod?: (...items: unknown[]) => void;
          queue: unknown[];
        }
      ).callMethod
        ? (
            fbq as unknown as { callMethod: (...items: unknown[]) => void }
          ).callMethod(...args)
        : (fbq as unknown as { queue: unknown[] }).queue.push(args);
    } as Window["fbq"] & { queue: unknown[]; loaded: boolean; version: string };

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
    window.fbq("init", META_PIXEL_ID);
    track("PageView");
    track("ViewContent", {
      center: CITY_NAME,
      content_name: "Tunnel épilation laser JFG Clinic Orvault",
    });
  }, []);

  function toggleZone(zone: string) {
    setSelectedZones((current) =>
      current.includes(zone)
        ? current.filter((item) => item !== zone)
        : [...current, zone],
    );
  }

  function openForm() {
    if (selectedZones.length === 0) return;
    track("CustomizeProduct", { center: CITY_NAME, zones: selectedZones });
    setStep("form");
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      full_name: String(data.get("full_name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      email: String(data.get("email") ?? ""),
      message_opt_in: messageOptIn,
      contact_opt_in: messageOptIn,
      zones: selectedZones,
      center: CITY_NAME,
      center_display_name: CENTER_DISPLAY,
      offer: "1 zone achetée = 1 zone offerte + bilan et test offerts sans engagement",
      page: `Épilation laser ${CENTER_DISPLAY}`,
      source: "jfg-clinic-orvault",
      submitted_at: new Date().toISOString(),
      page_url: typeof window !== "undefined" ? window.location.href : "",
      ...trackingParams,
    };

    setIsSubmitting(true);
    try {
      if (LEAD_WEBHOOK_URL) {
        await fetch(LEAD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      track("Lead", {
        content_name: "1 zone achetée = 1 zone offerte",
        center: CITY_NAME,
        zones: selectedZones.join(", "),
      });
      setStep("thanks");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="site-shell">
      <header className="site-header" aria-label="JFG Clinic">
        <img alt="JFG Clinic" className="brand-logo" src="/jfg-logo-2026.jpg" />
      </header>

      <section className="hero-section" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">Offre limitée · Exclusive</p>
          <h1 id="page-title">1 zone achetée = 1 zone offerte</h1>
          <p className="hero-subtitle">Bilan et test offert sans engagement</p>
        </div>

        <div
          className="before-after-carousel"
          aria-label="Avant après épilation laser"
        >
          <div className="before-after-track">
            {[...beforeAfter, ...beforeAfter].map((item, index) => (
              <article
                className="before-after-card"
                key={`${item.area}-${index}`}
              >
                <div className="photo-pair">
                  <img
                    alt={`Avant après épilation laser - ${item.area}`}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : "auto"}
                    height={465}
                    loading={index === 0 ? "eager" : "lazy"}
                    src={item.src}
                    width={720}
                  />
                  <span className="before-badge">Avant</span>
                  <span className="after-badge">Après</span>
                </div>
                <strong>{item.area}</strong>
                <p>{item.result}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {step === "intro" && (
        <section className="quiz-panel" aria-labelledby="zone-question">
          <div>
            <p className="offer-ready">Votre offre 1+1 est presque prête</p>
            <p className="step-label">
              2 étapes pour réserver · offre limitée exclusive
            </p>
            <h2 id="zone-question">Quelle(s) zone(s) souhaitez-vous traiter ?</h2>
            <p className="helper-text">
              Cochez une ou plusieurs zones. 1 zone achetée = 1 zone offerte.
            </p>
          </div>

          <div className="zone-grid">
            {zones.map((zone) => {
              const isSelected = selectedZones.includes(zone);
              return (
                <button
                  aria-pressed={isSelected}
                  className={`zone-option ${isSelected ? "selected" : ""}`}
                  key={zone}
                  onClick={() => toggleZone(zone)}
                  type="button"
                >
                  <span className="checkmark" aria-hidden="true">
                    {isSelected ? "✓" : ""}
                  </span>
                  {zone}
                </button>
              );
            })}
          </div>

          <button
            className="primary-action"
            disabled={selectedZones.length === 0}
            onClick={openForm}
            type="button"
          >
            Profitez de l&apos;offre
          </button>
        </section>
      )}

      {step === "form" && (
        <section className="form-panel" aria-labelledby="form-title">
          <button
            className="back-button"
            onClick={() => setStep("intro")}
            type="button"
          >
            Retour
          </button>
          <p className="offer-ready">Dernière étape pour l’offre 1+1</p>
          <p className="step-label">On vous rappelle pour réserver</p>
          <h2 id="form-title">
            Vos coordonnées pour 1 zone achetée = 1 zone offerte.
          </h2>
          <p className="helper-text">
            Zone(s) à traiter : {selectedZones.join(", ")}
          </p>

          <form className="lead-form" onSubmit={submitLead}>
            <label>
              Prénom et nom
              <input name="full_name" placeholder="Votre nom complet" required />
            </label>
            <label>
              Téléphone
              <input
                inputMode="tel"
                name="phone"
                placeholder="06 00 00 00 00"
                required
                type="tel"
              />
            </label>
            <label>
              Email (optionnel)
              <input
                inputMode="email"
                name="email"
                placeholder="vous@email.com"
                type="email"
              />
            </label>

            <fieldset className="message-consent">
              <legend>
                Acceptez-vous d’être contacté(e) par téléphone et par WhatsApp
                par {CENTER_DISPLAY} concernant votre demande d’informations
                sur nos offres ? Votre consentement peut être retiré à tout
                moment.
              </legend>
              <label>
                <input
                  checked={messageOptIn === "oui"}
                  name="message_opt_in"
                  onChange={() => setMessageOptIn("oui")}
                  type="radio"
                  value="oui"
                />
                Oui
              </label>
              <label>
                <input
                  checked={messageOptIn === "non"}
                  name="message_opt_in"
                  onChange={() => setMessageOptIn("non")}
                  type="radio"
                  value="non"
                />
                Non
              </label>
            </fieldset>

            <button
              className="primary-action"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Envoi en cours..." : "Profitez de l'offre"}
            </button>
          </form>
        </section>
      )}

      {step === "thanks" && (
        <section className="thanks-panel" aria-labelledby="thanks-title">
          <p className="step-label">Demande reçue</p>
          <h2 id="thanks-title">Merci, votre demande est bien prise en compte.</h2>
          <p>
            L&apos;équipe {CENTER_DISPLAY} vous rappelle rapidement pour
            confirmer votre offre 1 zone achetée = 1 zone offerte, ainsi que
            votre bilan et test offerts sans engagement.
          </p>
        </section>
      )}

      <section className="proof-section" aria-labelledby="proof-title">
        <h2 id="proof-title">Ce que nos clients disent de nous</h2>
        <div className="review-grid">
          {reviewFrames.map((review) => (
            <figure className="review-frame" key={review.name}>
              <img
                alt={`Avis Google de ${review.name}`}
                decoding="async"
                height={270}
                loading="lazy"
                src={review.src}
                width={760}
              />
              <figcaption>Avis Google vérifié</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <h2 id="faq-title">Questions fréquentes</h2>
        <div className="faq-list">
          {faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
