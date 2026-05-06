# ROADMAP - Sell & Scan MVP

## Overzicht
Sell&Scan is een P2P marktplaats waar gebruikers met één foto een object kunnen scannen, en waar een AI (EU AI Act compliant) de advertentie opstelt en onderhandelt namens de eigenaar.

## Fase 1: Basis en Validatie (Voltooid)
- [x] PWA setup met Vite & React
- [x] Mobiele-eerste UI/UX (Tailwind, Lucide, routing)
- [x] Firebase integratie voor Auth & Firestore
- [x] Multi-taal ondersteuning (i18n - NL/EN)
- [x] Camera functionaliteit voor "Scannen" via `react-webcam`
- [x] AI Integratie (Gemini 3.1) voor automatische titels, omschrijvingen en prijsinschattingen via foto-analyse.
- [x] GDPR en EU AI Act compliance pages.
- [x] Basisprofiel weergave en 'Discover' weergave.

## Fase 2: Datalaag & Extensies (Voltooid)
- [x] Opslaan van gescande items in Firestore (`listings`-collectie) met de `creator` ID en gegenereerde data.
- [x] Ophalen van actieve items uit Firestore en weergeven op de `Discover` pagina, inclusief categorieën.
- [x] Ophalen van eigen items op de `Profile` pagina.
- [x] Zoekfunctie in data geïmplementeerd in `Search.tsx` (Client-side filtering op 'active' status).
- [x] Details pagina voor advertenties (`ListingDetail.tsx`).

## Fase 3: Het AI Handelssysteem (Voltooid)
- [x] **Berichten- en Onderhandelingssysteem (`Messages.tsx` & `ChatView.tsx`)**
  - Aanmaken van een `ChatRoom` in Firestore zodra iemand in "Discover" een item wil kopen.
  - De koper stuurt berichten ('Offers' of normale text).
  - Een cloud-functie (of client-side voor MVP demo) triggert de AI. De AI bekijkt de berichten via de `history` van de chatroom. 
  - De AI vergelijkt het aanbod met de verborgen `bottomPrice`. Ligt het erboven? Deal gesloten (+ status update naar 'closed'). Ligt het eronder? De AI probeert te onderhandelen.
- [x] **Betaling en Escrow simulatie → Contactgegevens overdracht**
  - Een knop verschijnt wanneer de AI Agent de deal heeft gesloten (`agreedPrice`), waarmee de overdracht/contactgegevens onderling worden uitgewisseld (omdat escrow buiten het platform blijft).

## Fase 4: Monetisatie en Groei & Toeters en Bellen (Voltooid)
- [x] Categorieën selectie via AI ('Scan') en filteren ('Discover').
- [x] Favorieten (Likes) functionaliteit (Mock UI - Visuele State op 'Discover' en 'ListingDetail').
- [x] Delen functie op 'Discover' en 'ListingDetail' die gebruikmaakt van Native OS SharingAPI (`navigator.share`).
- [x] Verwijderen (Beheren) van eigen advertenties via 'Profiel'.
- [x] Stripe integratie mock-ups voor het maandelijkse "Pro" abonnement, en de gratis proefperiode banners.

--- 

De eerste delen van het opslaan van advertenties (Fase 2) zijn zojuist geïmplementeerd. Ga naar "Scan" om een item via je web-cam te scannen. Die verschijnt hierna op je "Profiel" en (indien van een andere gebruiker) in de "Ontdek" feed!
