import { useEffect } from "react";
import { BUSINESS } from "./business";

export function useSEO({ title, description, path = "" }) {
  useEffect(() => {
    const full = title ? `${title} | ${BUSINESS.name} Sarnia` : `${BUSINESS.fullName} | Sarnia, ON`;
    document.title = full;
    const setMeta = (name, content, attr = "name") => {
      let el = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    if (description) {
      setMeta("description", description);
      setMeta("og:title", full, "property");
      setMeta("og:description", description, "property");
    }
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `https://${BUSINESS.website}${path}`);
  }, [title, description, path]);
}
