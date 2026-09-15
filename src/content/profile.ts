import type { Profile, Zone } from "./types";

export const PROFILE: Profile = {
  name: "Andrés Aguilar",
  title: "Technical Program Manager",
  summary:
    "Technical Program Manager with 20+ years delivering enterprise SaaS, payment platforms, and cloud software across fintech, healthcare, and social impact. I have led cross-functional teams of up to 25 people, and I still write code — which is why I spot risk early and can hold a real conversation with the engineers building the thing.",
  location: "Buenos Aires, Argentina",
  email: "andresd.aguilar@gmail.com",
  linkedin: "https://linkedin.com/in/andresaguilar",
  github: "https://github.com/andresdaguilar",
  resume: "/Andres_Aguilar_Resume.pdf",
};

/** Rooms in walking order. Doubles as the fast-travel elevator directory. */
export const ZONES: Zone[] = [
  { id: "entrance", name: "Street", caption: "A door, and a name on the sign." },
  { id: "career", name: "The Climb", caption: "Twenty years, one corridor, going up." },
  { id: "academy", name: "The Wall", caption: "A degree and five certificates." },
  { id: "library", name: "The Library", caption: "Books written, books read." },
  { id: "studio", name: "The Studio", caption: "Six shows, on air." },
  { id: "workshop", name: "The Workshop", caption: "Things built after hours." },
  { id: "rooftop", name: "The Roof", caption: "Where you can find me." },
];
