# TruePackage — Data Sources & Research Log
**Last updated: March 2026**
**Compiled by: Supradeep (TruePackage)**

This document records every data point used in TruePackage's calculations, its source, and the date it was verified. Update this file whenever data is refreshed.

---

## Sources Used

| # | Source | Type | URL | Notes |
|---|--------|------|-----|-------|
| 1 | Entgeltatlas, Bundesagentur für Arbeit | German salary medians | entgeltatlas.arbeitsagentur.de | Official government employment statistics. Most authoritative for German salary floors. Updated annually. |
| 2 | Gehalt.de | German salary ranges | gehalt.de | Largest German salary database. Quartile data available. Median software engineer: €69,816. |
| 3 | Stepstone Gehaltsreport 2025 | German salary by profession + region | stepstone.de/gehalt | Published annually. Mechanical engineer median (leadership): €84,500. Without leadership: €68,250. |
| 4 | jobvector Gehaltsanalyse 2025 | German salary by profession | jobvector.de/gehalt | Mechanical engineer average: €61,727 (range €52,762–€71,500). Entry: €56,711. |
| 5 | ingenieur.de / VDI Gehaltsstudie | Engineering salaries by field | ingenieur.de/karriere/gehalt | Electrical engineer entry median: €52,060. Machine & plant construction median: €79,750. |
| 6 | Numbeo Germany | City cost of living | numbeo.com | Crowdsourced, continuously updated. Used for rent, groceries, transport, utilities per city. Last verified March 2026. |
| 7 | germany-visa.org cost of living 2026 | City cost comparisons | germany-visa.org | Leipzig monthly cost €1,001–€1,702. Dresden similar. Cites Numbeo. |
| 8 | studying-in-germany.org | City rent comparisons | studying-in-germany.org | Leipzig rent 38.7% cheaper than Stuttgart. Dresden 37.1% cheaper than Stuttgart. |
| 9 | terratern.com — Data Engineer Salary 2025 | Data/ML salary | terratern.com | Junior €44–54K, mid €65–85K, senior €85K+. Sources: Hays, Glassdoor, TechPays. |
| 10 | levels.fyi Germany | Tech salary (comp) | levels.fyi | Software engineer range €68–99K. Data engineer median €76,542. Large-company skew. |
| 11 | tech-careers.de | City-level software salaries | tech-careers.de | Berlin entry €45–55K, Munich entry €50–60K. Hamburg entry €45–55K. |
| 12 | terratern.com — Product Manager Salary 2026 | PM salary | terratern.com | PM salary growth 8–12% YoY. Senior Munich €85K. AI PM premium 20–30%. |
| 13 | PayScale — Mechanical Engineer Germany 2026 | Mech eng salary | payscale.com | Average €52,822. |
| 14 | NoBroker India | Indian city costs | nobroker.in | Gurgaon 2BHK city centre ~₹32,000/mo. |
| 15 | 99acres India | Indian city rental listings | 99acres.com | Live listings. Indore 2BHK ₹15–18K. Gurgaon DLF ₹30–40K. |
| 16 | QuikrHomes | Indian city rental listings | quikr.com | Kochi 2BHK from ₹27K. Coimbatore from ₹20K furnished. |
| 17 | assureshift.in — Gurgaon cost 2025 | Gurgaon cost of living | assureshift.in | 2BHK prime ₹30–40K, outskirts ₹20–30K. Families ₹45–70K. |
| 18 | cribapp.com — Average Rent India 2025 | Indian city rent trends | cribapp.com | Noida Sector 150 average ₹25K, +63% since 2019. |

---

## German Salary Ranges by Profession
### Methodology
- All figures are **gross annual salary in EUR**
- Ranges represent **25th–75th percentile** (middle 50% of earners)
- Three seniority levels: Junior (0–3 yrs), Mid (4–8 yrs), Senior (8+ yrs)
- Munich is the anchor city. Other cities use verified multipliers from Numbeo + Stepstone regional data
- Sources: Gehalt.de (medians), jobvector (ranges), ingenieur.de/VDI (engineering), Stepstone (regional), tech-careers.de (software by city)

### City Salary Multipliers vs Munich
| City | Multiplier | Basis |
|------|-----------|-------|
| Munich | 1.00 | anchor |
| Frankfurt | 0.96 | Stepstone regional data |
| Hamburg | 0.94 | Stepstone + tech-careers |
| Stuttgart | 0.97 | automotive premium, Stepstone |
| Berlin | 0.91 | tech-careers.de city data |
| Dusseldorf | 0.93 | Stepstone regional |
| Cologne | 0.92 | Stepstone regional |
| Karlsruhe | 0.94 | SAP hub, similar to Hamburg |
| Mannheim | 0.93 | SAP corridor |
| Nuremberg | 0.90 | Stepstone regional |
| Dresden | 0.87 | East Germany, studying-in-germany.org |
| Leipzig | 0.86 | East Germany, studying-in-germany.org |

---

### 1. Software Engineer / IT
**Sources: Gehalt.de (median €69,816), tech-careers.de (city breakdown), terratern.com (Munich senior up to €85K)**

| City | Junior (0–3y) | Mid (4–8y) | Senior (8+y) |
|------|-------------|----------|------------|
| Munich | €48–60K | €65–82K | €82–105K |
| Frankfurt | €46–57K | €62–79K | €79–101K |
| Hamburg | €45–55K | €60–76K | €77–99K |
| Stuttgart | €47–58K | €63–80K | €80–103K |
| Berlin | €44–54K | €59–75K | €75–96K |
| Dusseldorf | €44–55K | €60–77K | €76–98K |
| Cologne | €44–54K | €60–76K | €75–97K |
| Karlsruhe | €45–56K | €61–78K | €77–99K |
| Mannheim | €44–55K | €60–77K | €76–98K |
| Nuremberg | €43–53K | €58–74K | €74–95K |
| Dresden | €42–51K | €56–72K | €71–91K |
| Leipzig | €41–51K | €56–71K | €71–90K |

---

### 2. Data / ML Engineer
**Sources: terratern.com (junior €44–54K, mid €65–85K, senior €85K+), levels.fyi (median €76,542), Glassdoor Germany average ~$70K**

| City | Junior (0–3y) | Mid (4–8y) | Senior (8+y) |
|------|-------------|----------|------------|
| Munich | €50–63K | €68–88K | €88–115K |
| Frankfurt | €48–60K | €65–85K | €85–110K |
| Hamburg | €47–59K | €64–83K | €83–107K |
| Stuttgart | €49–61K | €66–86K | €85–110K |
| Berlin | €46–57K | €62–80K | €80–103K |
| Dusseldorf | €47–58K | €63–82K | €81–105K |
| Cologne | €46–57K | €62–81K | €81–104K |
| Karlsruhe | €47–59K | €64–83K | €83–107K |
| Mannheim | €47–58K | €63–82K | €81–105K |
| Nuremberg | €45–56K | €61–79K | €79–102K |
| Dresden | €44–54K | €59–77K | €77–98K |
| Leipzig | €43–54K | €58–76K | €76–97K |

---

### 3. Mechanical Engineer
**Sources: jobvector (average €61,727, range €52,762–€71,500, entry €56,711), PayScale (€52,822 average), VDI/ingenieur.de (machine & plant construction median €79,750 with leadership), Entgeltatlas median €5,946/mo**

| City | Junior (0–3y) | Mid (4–8y) | Senior (8+y) |
|------|-------------|----------|------------|
| Munich | €43–54K | €58–72K | €72–92K |
| Frankfurt | €41–52K | €56–69K | €69–88K |
| Hamburg | €41–51K | €55–68K | €68–87K |
| Stuttgart | €42–53K | €56–70K | €70–90K |
| Berlin | €39–49K | €53–66K | €66–84K |
| Dusseldorf | €40–50K | €54–67K | €67–86K |
| Cologne | €40–50K | €53–67K | €66–85K |
| Karlsruhe | €41–51K | €55–68K | €68–87K |
| Mannheim | €40–50K | €54–67K | €67–86K |
| Nuremberg | €39–49K | €52–65K | €65–83K |
| Dresden | €37–47K | €50–63K | €63–80K |
| Leipzig | €37–46K | €50–62K | €62–79K |

---

### 4. Electrical Engineer
**Sources: ingenieur.de/VDI (entry median €52,060, Fach/Projektingenieur €64K, Abteilungsleiter €91,676), Glassdoor Germany average ~$64K, Entgeltatlas**

| City | Junior (0–3y) | Mid (4–8y) | Senior (8+y) |
|------|-------------|----------|------------|
| Munich | €44–55K | €60–75K | €74–96K |
| Frankfurt | €42–53K | €58–72K | €71–92K |
| Hamburg | €41–52K | €56–70K | €70–90K |
| Stuttgart | €43–54K | €58–73K | €72–93K |
| Berlin | €40–50K | €55–68K | €67–87K |
| Dusseldorf | €41–51K | €56–70K | €69–89K |
| Cologne | €41–51K | €55–69K | €68–88K |
| Karlsruhe | €42–52K | €57–71K | €70–91K |
| Mannheim | €41–51K | €56–70K | €69–89K |
| Nuremberg | €40–50K | €54–68K | €67–86K |
| Dresden | €38–48K | €52–65K | €64–83K |
| Leipzig | €38–47K | €51–64K | €64–82K |

---

### 5. Civil / Structural Engineer
**Sources: ingenieur.de (Bauingenieur median €66,770 all functions, Leitungsfunktion €65,750), VDI entry €48,144**

| City | Junior (0–3y) | Mid (4–8y) | Senior (8+y) |
|------|-------------|----------|------------|
| Munich | €40–50K | €55–68K | €66–85K |
| Frankfurt | €38–48K | €53–65K | €63–82K |
| Hamburg | €38–48K | €52–64K | €62–80K |
| Stuttgart | €39–49K | €53–66K | €64–83K |
| Berlin | €37–46K | €50–62K | €60–77K |
| Dusseldorf | €37–47K | €51–63K | €62–79K |
| Cologne | €37–46K | €51–63K | €61–79K |
| Karlsruhe | €38–47K | €52–64K | €62–80K |
| Mannheim | €37–47K | €51–63K | €62–79K |
| Nuremberg | €36–45K | €49–61K | €60–77K |
| Dresden | €35–43K | €47–59K | €57–73K |
| Leipzig | €34–43K | €46–58K | €56–72K |

---

### 6. Finance / Accounting
**Sources: Glassdoor Germany (accountant €45–65K), Stepstone regional data, Frankfurt premium for finance hub**

| City | Junior (0–3y) | Mid (4–8y) | Senior (8+y) |
|------|-------------|----------|------------|
| Munich | €42–52K | €57–72K | €72–94K |
| Frankfurt | €46–58K | €64–81K | €82–108K |
| Hamburg | €41–51K | €56–70K | €70–91K |
| Stuttgart | €40–50K | €55–69K | €69–89K |
| Berlin | €38–48K | €52–66K | €66–86K |
| Dusseldorf | €40–50K | €55–69K | €69–90K |
| Cologne | €39–49K | €54–68K | €68–88K |
| Karlsruhe | €39–49K | €54–67K | €67–87K |
| Mannheim | €39–49K | €54–67K | €67–87K |
| Nuremberg | €38–47K | €52–65K | €65–84K |
| Dresden | €36–45K | €49–62K | €62–80K |
| Leipzig | €35–44K | €48–61K | €61–79K |

---

### 7. Product Manager
**Sources: terratern.com (senior Munich €85K, 8–12% YoY growth), Stepstone PM data. Range adjusted to €85–115K for senior (not €95–125K) to reflect mid-size company reality.**

| City | Junior (0–3y) | Mid (4–8y) | Senior (8+y) |
|------|-------------|----------|------------|
| Munich | €50–63K | €70–88K | €85–115K |
| Frankfurt | €48–60K | €67–85K | €82–110K |
| Hamburg | €47–59K | €65–83K | €80–107K |
| Stuttgart | €47–59K | €66–83K | €82–110K |
| Berlin | €46–57K | €64–80K | €77–103K |
| Dusseldorf | €46–58K | €64–82K | €79–106K |
| Cologne | €45–57K | €63–81K | €78–104K |
| Karlsruhe | €47–58K | €65–82K | €79–106K |
| Mannheim | €46–58K | €64–81K | €79–105K |
| Nuremberg | €44–55K | €61–78K | €76–101K |
| Dresden | €43–53K | €59–75K | €73–97K |
| Leipzig | €42–52K | €58–74K | €72–96K |

---

### 8. Other / General
No market range displayed. Tool shows:
> *"We don't have market data for your field yet. Your [City] Number is still calculated from your city costs and family situation."*

---

## German City Cost of Living Data
### Methodology
- Rent ranges: WG room / 1BR / 2BR. Sources: Numbeo per-city data, germany-visa.org, studying-in-germany.org
- Groceries: Monthly for one person, mid-range supermarket (Rewe/Edeka). Source: Numbeo
- Transport: Monthly public transport pass (Deutschlandticket €49/mo nationally, local additions vary). Source: local transport authorities
- Utilities: Electricity + heating + water + internet for 1BR. Source: Numbeo

### New cities — verified March 2026

| City | WG rent | 1BR rent | 2BR rent | Groceries | Transport | Utilities |
|------|---------|---------|---------|-----------|-----------|----------|
| Karlsruhe | €420–650 | €900–1,350 | €1,250–1,750 | €280–370 | €80 | €130–180 |
| Leipzig | €320–500 | €650–1,000 | €900–1,350 | €260–350 | €63 | €110–160 |
| Dresden | €330–520 | €700–1,100 | €950–1,450 | €265–355 | €68 | €115–165 |
| Mannheim | €430–660 | €950–1,400 | €1,300–1,850 | €275–370 | €80 | €125–175 |

**Basis for Leipzig/Dresden:**
- Leipzig rent is 38.7% cheaper than Stuttgart. Dresden rent is 37.1% cheaper than Stuttgart.
- Leipzig monthly cost (without rent) €1,001. Dresden similar.

---

## Indian City Cost of Living Data
### New cities — verified March 2026

| City | 2BHK Rent | Domestic Help | Prof. Tax/yr | Groceries/mo | Notes |
|------|-----------|--------------|-------------|-------------|-------|
| Gurgaon | ₹28,000–55,000 | ₹12,000–18,000 | ₹0 | ₹12,000–18,000 | UP/Haryana: no PT. Prime areas DLF ₹30–40K. Families ₹45–70K. Car mandatory. |
| Noida | ₹18,000–38,000 | ₹10,000–15,000 | ₹0 | ₹11,000–16,000 | UP: no PT. Sector 150 avg ₹25K. Metro available. |
| Kochi | ₹15,000–28,000 | ₹8,000–12,000 | ₹2,400 | ₹9,000–14,000 | Kerala PT ₹200/mo. NRI returnee demand driving up prices. |
| Indore | ₹10,000–20,000 | ₹5,000–9,000 | ₹2,400 | ₹7,000–12,000 | MP PT ₹200/mo. Nipania area listings ₹15–18K. |
| Coimbatore | ₹10,000–18,000 | ₹6,000–10,000 | ₹2,400 | ₹8,000–13,000 | TN PT ₹200/mo. Fully furnished from ₹20K, unfurnished lower. |

**Sources:** 99acres live listings, QuikrHomes, NoBroker, assureshift.in, cribapp.com

---

## How to Update This Data

1. **German salaries** — Check Gehalt.de and Stepstone annually (typically January–February)
2. **German city costs** — Check Numbeo per-city pages quarterly
3. **Indian city costs** — Check 99acres and NoBroker quarterly
4. **Update the `Last updated` date at the top of this file**
5. **Update the source line in the app** — search for `DATA_UPDATED` constant in src/data/sources.ts

---

## Attribution for Display in App

The following text should appear in the app's "About the data" section:

> **Salary ranges** sourced from Gehalt.de, Stepstone Gehaltsreport, jobvector Gehaltsanalyse, and ingenieur.de/VDI Gehaltsstudie. German median salary data cross-referenced with Entgeltatlas (Bundesagentur für Arbeit). Ranges represent the 25th–75th percentile of reported salaries for each profession and city.
>
> **Cost of living** data sourced from Numbeo (city-level, March 2026), supplemented by germany-visa.org and studying-in-germany.org for city comparisons. Indian city costs sourced from 99acres, NoBroker, and QuikrHomes live listings (March 2026).
>
> **Last updated: March 2026.** Data is reviewed and updated quarterly. If you spot an error, use the feedback form.
