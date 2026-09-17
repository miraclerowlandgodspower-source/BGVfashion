export interface ShippingCalculationParams {
  country: string;
  state?: string;
  city?: string;
  subtotal: number;
}

export interface ShippingRateResult {
  fee: number;
  origin: string;
  destination: string;
  zone: string;
  estimatedDays: string;
  isFreeShipping: boolean;
  couriers: string[];
}

export function calculateShippingFee({
  country,
  state = "",
  city = "",
  subtotal,
}: ShippingCalculationParams): ShippingRateResult {
  const origin = "Ojo, Lagos, Nigeria";
  const normalizedCountry = country.trim().toLowerCase();

  // 1. DOMESTIC SHIPPING (Nigeria)
  if (normalizedCountry === "nigeria" || normalizedCountry === "") {
    // Free domestic delivery threshold over ₦150,000
    const isFree = subtotal >= 150000;

    const normalizedState = state.trim().toLowerCase();
    const normalizedCity = city.trim().toLowerCase();

    // A. LAGOS DESTINATIONS (Originating from Ojo)
    if (normalizedState === "lagos") {
      // Local immediate zone (Ojo, Alaba, Iba, Festac, Okokomaiko, Badagry)
      if (
        normalizedCity.includes("ojo") ||
        normalizedCity.includes("alaba") ||
        normalizedCity.includes("iba") ||
        normalizedCity.includes("festac") ||
        normalizedCity.includes("okokomaiko") ||
        normalizedCity.includes("ijanikin") ||
        normalizedCity.includes("amuwo") ||
        normalizedCity.includes("badagry")
      ) {
        return {
          fee: isFree ? 0 : 2500,
          origin,
          destination: `${city || "Ojo Environs"}, Lagos`,
          zone: "Lagos Local Zone (Ojo Corridor)",
          estimatedDays: "Same-day / Next-day delivery",
          isFreeShipping: isFree,
          couriers: ["BGV Express Dispatch", "GIG Logistics", "Gokada / Kwik"],
        };
      }

      // Lagos Mainland Central (Ikeja, Surulere, Yaba, Gbagada, Maryland, Oshodi)
      if (
        normalizedCity.includes("ikeja") ||
        normalizedCity.includes("surulere") ||
        normalizedCity.includes("yaba") ||
        normalizedCity.includes("gbagada") ||
        normalizedCity.includes("maryland") ||
        normalizedCity.includes("oshodi") ||
        normalizedCity.includes("isolo") ||
        normalizedCity.includes("agege") ||
        normalizedCity.includes("alimosho") ||
        normalizedCity.includes("egbeda")
      ) {
        return {
          fee: isFree ? 0 : 3500,
          origin,
          destination: `${city || "Mainland"}, Lagos`,
          zone: "Lagos Mainland Central",
          estimatedDays: "1–2 business days",
          isFreeShipping: isFree,
          couriers: ["GIG Logistics", "Terminal Africa Dispatch", "FedEx Lagos"],
        };
      }

      // Lagos Island & Outskirts (Lekki, VI, Ikoyi, Ajah, Ikorodu, Epe)
      return {
        fee: isFree ? 0 : 4500,
        origin,
        destination: `${city || "Island/Outer"}, Lagos`,
        zone: "Lagos Island & Outskirts",
        estimatedDays: "1–2 business days",
        isFreeShipping: isFree,
        couriers: ["GIG Logistics", "DHL Express Lagos", "Terminal Africa"],
      };
    }

    // B. SOUTH-WEST NEIGHBORING STATES (Ogun, Oyo, Osun, Ondo, Ekiti)
    const swStates = ["ogun", "oyo", "osun", "ondo", "ekiti"];
    if (swStates.includes(normalizedState)) {
      return {
        fee: isFree ? 0 : 5800,
        origin,
        destination: `${state}, Nigeria`,
        zone: "South-West Regional Corridor",
        estimatedDays: "2–3 business days",
        isFreeShipping: isFree,
        couriers: ["GIG Logistics", "Speedaf Express", "DHL Nigeria"],
      };
    }

    // C. FEDERAL CAPITAL TERRITORY (Abuja) & MAJOR METROS (Rivers, Edo, Delta, Anambra, Kano, Kaduna, Enugu)
    const majorMetros = ["abuja (fct)", "abuja", "rivers", "edo", "delta", "anambra", "kano", "kaduna", "enugu", "akwa ibom"];
    if (majorMetros.includes(normalizedState)) {
      return {
        fee: isFree ? 0 : 7500,
        origin,
        destination: `${state}, Nigeria`,
        zone: "Major Inter-State Metro",
        estimatedDays: "2–4 business days",
        isFreeShipping: isFree,
        couriers: ["DHL Nigeria", "GIG Logistics", "FedEx Inter-State"],
      };
    }

    // D. REST OF NIGERIA
    return {
      fee: isFree ? 0 : 8500,
      origin,
      destination: `${state || "National Destination"}, Nigeria`,
      zone: "National Inter-State Delivery",
      estimatedDays: "3–5 business days",
      isFreeShipping: isFree,
      couriers: ["DHL Express", "GIG Logistics", "NIPOST EMS"],
    };
  }

  // 2. INTERNATIONAL SHIPPING (Tiered by Global Zone)
  const westAfrica = ["ghana", "benin", "togo", "côte d'ivoire", "ivory coast", "senegal", "cameroon", "liberia", "sierra leone"];
  if (westAfrica.includes(normalizedCountry)) {
    return {
      fee: 24000, // ~$15
      origin,
      destination: country,
      zone: "West Africa Regional",
      estimatedDays: "3–5 business days",
      isFreeShipping: false,
      couriers: ["DHL Express Africa", "FedEx Regional"],
    };
  }

  const ukEurope = ["united kingdom", "germany", "france", "italy", "spain", "netherlands", "belgium", "switzerland", "ireland", "sweden", "austria", "poland", "portugal"];
  if (ukEurope.includes(normalizedCountry)) {
    return {
      fee: 35000, // ~$22
      origin,
      destination: country,
      zone: "UK & European Union",
      estimatedDays: "4–6 business days",
      isFreeShipping: false,
      couriers: ["DHL Express International", "FedEx Priority"],
    };
  }

  const northAmerica = ["united states", "canada", "mexico"];
  if (northAmerica.includes(normalizedCountry)) {
    return {
      fee: 42000, // ~$26
      origin,
      destination: country,
      zone: "North America Zone",
      estimatedDays: "4–7 business days",
      isFreeShipping: false,
      couriers: ["DHL Express Worldwide", "FedEx International Priority", "UPS Worldwide"],
    };
  }

  // Rest of the 193 Countries
  return {
    fee: 48000, // ~$30
    origin,
    destination: country,
    zone: "Rest of World International",
    estimatedDays: "5–9 business days",
    isFreeShipping: false,
    couriers: ["DHL Express Worldwide", "FedEx International"],
  };
}
