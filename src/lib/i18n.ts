import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  nl: {
    translation: {
      nav: {
        discover: "Ontdek",
        search: "Zoeken",
        scan: "Scan",
        messages: "Berichten",
        profile: "Profiel",
      },
      discover: {
        title: "Ontdek Deals",
        nearby: "In de buurt",
        match: "MATCH",
        hotDeal: "HOT DEAL",
        buy: "Koop",
        freeMonth: "1 Maand Gratis Pro.",
        freeMonthDesc: "Nodig 1 vriend uit en ontvang de AI Onderhandelaar gratis.",
        shareLink: "Deel Link",
      },
      search: {
        placeholder: "Zoek producten of categorieën...",
        description: "Vind de beste deals wereldwijd met AI.",
        noResults: "Geen resultaten gevonden.",
      },
      scan: {
        analyzing: "AI analyseert product...",
        analyzingText: "Bezig met zoeken in de globale database...",
        title: "TITEL",
        description: "BESCHRIJVING (3 REGELS)",
        askingPrice: "VRAAGPRIJS",
        bottomPrice: "BODEMPRIJS",
        newPhoto: "Nieuwe Foto",
        setLive: "Zet Live",
      },
      listing: {
        shareText: "Bekijk {{title}} op Rommelmarkt.app",
        shareBtn: "Advertentie Delen",
        locationTitle: "Locatie",
        locationDesc: "De locatie van deze aanbieder (bij benadering).",
        loadingCoords: "Laad coördinaten...",
        copied: "Link is gekopieerd naar klembord!"
      },
      messages: {
        title: "Berichten & Deals",
        active: "Actief",
        closed: "Gesloten",
        chatPlaceholder: "Typ een bericht of doe een bod...",
        send: "Stuur",
        aiNegotiator: "AI Onderhandelaar",
        dealClosed: "🎉 Deal gesloten! Item verplaatst naar 'Gesloten Deals'.",
        yourOffer: "Jouw bod:"
      },
      profile: {
        title: "Jouw Profiel",
        loginDesc: "Log in om je advertenties en deals te beheren.",
        loginBtn: "Inloggen met Google",
        logout: "Uitloggen",
        closedDeals: "Gesloten Deals",
        noDeals: "Nog geen gesloten deals.",
        inviteTitle: "Verdien Gratis Maanden",
        inviteDesc: "Nodig je vrienden uit.",
        inviteBtn: "Kopieer Invite Link",
        favorites: "Favorieten",
        favoritesDesc: "Opgeslagen items",
        notifications: "Notificaties",
        notificationsEnabled: "Ingeschakeld",
        notificationsEnable: "Inschakelen",
        language: "Taal wijzigen",
        legal: "Legal & GDPR",
        legalDesc: "EU AI Act",
        myListings: "Mijn Advertenties",
        noListings: "Nog geen advertenties",
        adjustPrice: "Prijs Aanpassen",
        save: "Opslaan",
        settings: "Instellingen",
        displayName: "Weergavenaam",
        email: "E-mailadres",
        emailDesc: "Gekoppeld via Google. Kan niet worden gewijzigd.",
        account: "Account",
        deleteAccount: "Account verwijderen",
        phone: "Telefoonnummer",
        phonePlaceholder: "Bijv. 06 12345678",
        city: "Woonplaats",
        zipCode: "Postcode",
        bio: "Over mij",
        bioPlaceholder: "Vertel iets over jezelf...",
        deliveryPref: "Voorkeur overdracht",
        pickup: "Ophalen",
        shipping: "Verzenden",
        both: "Ophalen & Verzenden"
      }
    }
  },
  en: {
    translation: {
      nav: {
        discover: "Discover",
        search: "Search",
        scan: "Scan",
        messages: "Messages",
        profile: "Profile",
      },
      discover: {
        title: "Discover Deals",
        nearby: "Nearby",
        match: "MATCH",
        hotDeal: "HOT DEAL",
        buy: "Buy",
        freeMonth: "1 Month Free Pro.",
        freeMonthDesc: "Invite 1 friend and get the AI Negotiator for free.",
        shareLink: "Share Link",
      },
      search: {
        placeholder: "Search products or categories...",
        description: "Find the best deals globally with AI.",
        noResults: "No results found.",
      },
      scan: {
        analyzing: "AI is analyzing product...",
        analyzingText: "Searching the global database...",
        title: "TITLE",
        description: "DESCRIPTION (3 LINES)",
        askingPrice: "ASKING PRICE",
        bottomPrice: "BOTTOM PRICE",
        newPhoto: "New Photo",
        setLive: "Set Live",
      },
      listing: {
        shareText: "Check out {{title}} on App",
        shareBtn: "Share Ad",
        locationTitle: "Location",
        locationDesc: "Approximate location of the seller.",
        loadingCoords: "Loading coordinates...",
        copied: "Link copied to clipboard!"
      },
      messages: {
        title: "Messages & Deals",
        active: "Active",
        closed: "Closed",
        chatPlaceholder: "Type a message or make an offer...",
        send: "Send",
        aiNegotiator: "AI Negotiator",
        dealClosed: "🎉 Deal closed! Item moved to 'Closed Deals'.",
        yourOffer: "Your offer:"
      },
      profile: {
        title: "Your Profile",
        loginDesc: "Log in to manage your ads and deals.",
        loginBtn: "Log in with Google",
        logout: "Log out",
        closedDeals: "Closed Deals",
        noDeals: "No closed deals yet.",
        inviteTitle: "Earn Free Months",
        inviteDesc: "Invite friends.",
        inviteBtn: "Copy Invite Link",
        favorites: "Favorites",
        favoritesDesc: "Saved items",
        notifications: "Notifications",
        notificationsEnabled: "Enabled",
        notificationsEnable: "Enable",
        language: "Change language",
        legal: "Legal & GDPR",
        legalDesc: "EU AI Act",
        myListings: "My Listings",
        noListings: "No ads yet",
        adjustPrice: "Adjust Price",
        save: "Save",
        settings: "Settings",
        displayName: "Display Name",
        email: "Email address",
        emailDesc: "Linked via Google. Cannot be changed.",
        account: "Account",
        deleteAccount: "Delete Account",
        phone: "Phone number",
        phonePlaceholder: "e.g. +31 6 12345678",
        city: "City",
        zipCode: "Zip code",
        bio: "About me",
        bioPlaceholder: "Tell us a bit about yourself...",
        deliveryPref: "Delivery preference",
        pickup: "Pickup",
        shipping: "Shipping",
        both: "Pickup & Shipping"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'nl',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
