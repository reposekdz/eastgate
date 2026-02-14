// ─── Kinyarwanda Data & Translations for EastGate Hotel ───────────────

export const navLinksKw = [
  { label: "Ahabanza", href: "/" },
  { label: "Twebwe", href: "/about" },
  { label: "Ibyumba", href: "/rooms" },
  { label: "Ibiryo", href: "/dining" },
  { label: "Spa", href: "/spa" },
  { label: "Ibirori", href: "/events" },
  { label: "Amafoto", href: "/gallery" },
  { label: "Twandikire", href: "/contact" },
];

export const bottomNavLinks = [
  { label: "Ahabanza", href: "/", icon: "Home" as const },
  { label: "Ibyumba", href: "/rooms", icon: "Bed" as const },
  { label: "Amafoto", href: "/gallery", icon: "Images" as const },
  { label: "Twebwe", href: "/about", icon: "Users" as const },
  { label: "Byose", href: "#more", icon: "Menu" as const },
];

export const moreMenuLinks = [
  { label: "Ibiryo", href: "/dining", icon: "UtensilsCrossed" as const },
  { label: "Spa n'Ubuzima", href: "/spa", icon: "Sparkles" as const },
  { label: "Ibirori", href: "/events", icon: "CalendarDays" as const },
  { label: "Twandikire", href: "/contact", icon: "MessageCircle" as const },
];

export const heroContent = {
  subtitle: "EastGate Hotel · Rwanda",
  title: "Aho Ubwiza Buhura",
  titleAccent: "n'Umutima wa Afurika",
  description:
    "Shakira ubunararibonye budashobora guhura n'ubundi mu gihugu cy'ibihumbi by'imisozi. Buri akanya muri EastGate byubatswe kugira ngo bikore ibihe bitazibagirana.",
  ctaPrimary: "Gufata Icyumba",
  ctaSecondary: "Shakisha",
};

export const aboutContent = {
  sectionLabel: "Murakaze",
  title: "Murakaze kuri",
  titleAccent: "EastGate",
  description:
    "Ahantu h'ubwiza bushyizwe mu bidukikije bitangaje by'u Rwanda. Ihoteli yacu ihuza uburyo bwo kwakira abashyitsi bw'isi yose hamwe n'ubushyuhe nyabwo bw'Abanyafurika, itanga uburambe burenze ibisanzwe.",
  descriptionSecondary:
    "Kuva twashinzwe, twiyemeje gutanga serivisi zidasanzwe ziha icyubahiro umuco ukungahaye w'u Rwanda ndetse tugahatana n'uburyo bwo kwakira abashyitsi bw'umwimerere abashyitsi bacu bishimira.",
  ctaText: "Menya Byinshi",
  stats: [
    { value: "15+", label: "Imyaka y'uburambe" },
    { value: "120+", label: "Ibyumba n'Amasuite" },
    { value: "50K+", label: "Abashyitsi bahaye" },
    { value: "4.9", label: "Amanota y'abashyitsi" },
  ],
  mission: {
    title: "Intego Yacu",
    description:
      "Gutanga uburambe bw'ubwiza bwo mu rwego rwo hejuru bushingiye ku muco w'u Rwanda, tugashimisha buri mushyitsi n'ubwitange n'ubunyangamugayo budahinduka.",
  },
  vision: {
    title: "Icyerekezo Cyacu",
    description:
      "Kuba ihoteli y'umwimerere yatoranijwe mu Burasirazuba bw'Afurika, izwi ku miterere yayo n'uburyo iha agaciro abashyitsi n'abakozi bayo.",
  },
  values: [
    {
      title: "Ubwitange",
      description: "Turenze ibyo abashyitsi bacu biteze buri gihe.",
    },
    {
      title: "Ubuntu",
      description: "Twakira buri muntu n'icyubahiro n'ubushyuhe.",
    },
    {
      title: "Ubunyangamugayo",
      description: "Dukora ibintu byiza mu buryo bugaragara kandi bw'umutekano.",
    },
    {
      title: "Umuco",
      description: "Twirata kandi duha agaciro umurage ukungahaye w'u Rwanda.",
    },
  ],
  team: [
    {
      name: "Jean-Pierre Habimana",
      role: "Umuyobozi Mukuru",
      avatar: "https://i.pravatar.cc/200?u=jp-habimana-ceo",
      bio: "Afite uburambe bw'imyaka 20+ mu kwakira abashyitsi b'umwimerere.",
    },
    {
      name: "Diane Uwimana",
      role: "Umuyobozi w'Ibikorwa",
      avatar: "https://i.pravatar.cc/200?u=diane-uwimana-ops",
      bio: "Afite impano yo gukurikirana ibintu byose nta kintu na kimwe gihunga.",
    },
    {
      name: "Patrick Niyonsaba",
      role: "Umuyobozi w'Uburambe bw'Abashyitsi",
      avatar: "https://i.pravatar.cc/200?u=patrick-niyonsaba-guest",
      bio: "Yihariye gukora ibihe bitazibagirana ku bashyitsi bose.",
    },
    {
      name: "Grace Uwase",
      role: "Umuyobozi Mukuru w'Imari",
      avatar: "https://i.pravatar.cc/200?u=grace-uwase-finance",
      bio: "Yemeza ko EastGate yiyongera kandi igumaho.",
    },
  ],
};

export const roomsContent = {
  sectionLabel: "Aho Kuryama",
  title: "Ibyumba n'Amasuite",
  description:
    "Buri cyumba ni umurimo w'ubuhanga mu buhumure n'ubwiza, cyubatswe kugira ngo gitange ahantu ho kuruhukira nyuma y'umunsi wo gushakisha.",
  rooms: [
    {
      id: 1,
      name: "Icyumba Cyiza",
      nameEn: "Deluxe Room",
      description:
        "Ubuhumure bwagutse bufite isura y'imisozi ya Kigali. Gifite uburiri bw'umwimerere, ubwiherero bw'amabuye, n'ibaraza ryihariye.",
      price: "Kuva RWF 250,000/ijoro",
      image: "https://images.pexels.com/photos/34672504/pexels-photo-34672504.jpeg",
      alt: "Icyumba cyiza cy'ihoteli — Ifoto na Moussa Idrissi kuri Pexels",
      amenities: ["Wi-Fi Kubuntu", "TV Nini", "Mini Bar", "Serivisi y'Icyumba"],
    },
    {
      id: 2,
      name: "Suite y'Umuyobozi",
      nameEn: "Executive Suite",
      description:
        "Uburambe buhanitse bufite ahantu ho guturana hatandukanye, ibikoresho by'umwimerere, n'umukozi w'uwihariye ku bashoramari bakomeye.",
      price: "Kuva RWF 450,000/ijoro",
      image: "https://images.pexels.com/photos/5883728/pexels-photo-5883728.jpeg",
      alt: "Suite y'ubwiza — Ifoto na thiha soe kuri Pexels",
      amenities: ["Isura y'Igikoni", "Ubwiherero bw'Isipurangi", "Butler", "Uburiri bw'Umwami"],
    },
    {
      id: 3,
      name: "Suite ya Perezida",
      nameEn: "Presidential Suite",
      description:
        "Igipimo cyo hejuru cy'ubwiza — ahantu hagutse, ifunguro ry'umwihariye, aho kwitegereza ku giti cyawe, n'uburyo bwo gufashwa bwihariye.",
      price: "Kuva RWF 850,000/ijoro",
      image: "https://images.pexels.com/photos/18285947/pexels-photo-18285947.jpeg",
      alt: "Suite ya Perezida — Ifoto na edithub pro kuri Pexels",
      amenities: ["Isanzure Ryihariye", "Isomero Ryihariye", "Ikiraro", "Panorama 360°"],
    },
  ],
  ctaText: "Reba Byinshi",
  bookText: "Gufata Icyumba",
};

export const diningContent = {
  sectionLabel: "Ubuhanga bwo Guteka",
  title: "Ryoherwa",
  titleAccent: "n'Ibiryo Byiza",
  description:
    "Abateki bacu bahawe ibihembo bahuriza imyunyu ya kera y'u Rwanda n'ubuhanga bwo guteka bw'isi yose. Kuva mu ifunguro ryo ku meza kuva ku murima kugeza ku ifunguro ry'umwihariye, buri ifunguro rivuga inkuru.",
  menuHighlights: [
    {
      name: "Amafi ya Tilapiya y'Ikiyaga Kivu",
      description: "Amafi mashya hamwe n'imboga n'umuceri",
      price: "RWF 18,000",
      category: "Ibiryo Nyamukuru",
    },
    {
      name: "Inyama z'Ibiganiro",
      description: "Inyama zokejwe ku muriro hamwe n'ibirayi n'saladi",
      price: "RWF 22,000",
      category: "Ibiryo Nyamukuru",
    },
    {
      name: "Isombe n'Igitoki",
      description: "Imyumbati y'amababi hamwe n'igitoki cy'u Rwanda",
      price: "RWF 14,000",
      category: "Ibiryo Nyamukuru",
    },
    {
      name: "Ikawa y'u Rwanda",
      description: "Ikawa nziza yavuye mu Rwanda",
      price: "RWF 5,000",
      category: "Ibinyobwa",
    },
    {
      name: "Umutobe Mushya",
      description: "Maracuja, Imyembe, cyangwa bivanze",
      price: "RWF 6,000",
      category: "Ibinyobwa",
    },
    {
      name: "Gateau yo Shokola",
      description: "Gateau y'ubushyuhe hamwe n'ubukonji bwa vanila",
      price: "RWF 10,000",
      category: "Dessert",
    },
  ],
  ctaText: "Gufata Intebe",
};

export const spaContent = {
  sectionLabel: "Spa n'Ubuzima",
  title: "Subiza Ubuzima",
  titleAccent: "Umutima Wawe",
  description:
    "Shyira ubuzima bwawe mu mahoro muri spa yacu yuzuye. Yashushanyije n'imigenzo ya kera yo gukiza y'Abanyafurika, imiti yacu ikoresha ibimera byo mu gihugu kugira ngo bisubize amahoro n'imbaraga.",
  services: [
    {
      name: "Gukanda ku Mabuye y'Afurika",
      description: "Gukanda gukoresha amabuye ashyushye kugira ngo bukire imiheto.",
      duration: "90 min",
      price: "RWF 120,000",
    },
    {
      name: "Gusiga Ikawa y'u Rwanda",
      description: "Isuku ry'umubiri rikoresha ikawa y'u Rwanda yavuye mu murima.",
      duration: "60 min",
      price: "RWF 85,000",
    },
    {
      name: "Guhumeka kwa Volkano",
      description: "Ibumba ry'igitutu cy'Agashyitsi kigufasha gukuramo imyanda.",
      duration: "75 min",
      price: "RWF 95,000",
    },
    {
      name: "Yoga no Gutekereza",
      description: "Amasomo y'amahoro agufasha gutuza umutwe n'umubiri.",
      duration: "60 min",
      price: "RWF 45,000",
    },
  ],
  ctaText: "Gufata Imiti",
};

export const eventsContent = {
  sectionLabel: "Ibirori n'Inama",
  title: "Ahantu Hadasanzwe ku",
  titleAccent: "Bihe Bidasanzwe",
  description:
    "Kuva mu birori binini kugeza mu nama z'ibucuruzi z'umwihariye, ahantu hacu hashobora guhinduka ndetse n'itsinda ry'ibirori ryihariye ryemeza ko buri guteranira ari nta nenge.",
  types: [
    { name: "Ubukwe", icon: "Heart" },
    { name: "Inama z'Ibucuruzi", icon: "Briefcase" },
    { name: "Amahuriro", icon: "Presentation" },
    { name: "Ifunguro ry'Umwihariye", icon: "Wine" },
    { name: "Ibirori Binini", icon: "PartyPopper" },
  ],
  ctaText: "Tegura Igikorwa Cyawe",
  venues: [
    {
      name: "Icyumba Kinini cy'Ibirori",
      capacity: "500 abantu",
      description: "Ahantu hacu hanini kandi heza cyane ku birori binini.",
    },
    {
      name: "Ubusitani bwo Hanze",
      capacity: "200 abantu",
      description: "Ahantu heza hejuru he hanze ku birori byo mu ijoro.",
    },
    {
      name: "Icyumba cy'Inama A",
      capacity: "80 abantu",
      description: "Icyumba gifite ibikoresho byose by'ikoranabuhanga ku nama.",
    },
    {
      name: "Icyumba cy'Abashyitsi Beza",
      capacity: "30 abantu",
      description: "Ahantu hihariye ku ifunguro ry'umwihariye n'ibirori bito.",
    },
  ],
};

export const galleryContent = {
  sectionLabel: "Amafoto",
  title: "Shakisha Ubwiza bwa",
  titleAccent: "EastGate",
  description: "Reba amafoto y'ihoteli yacu, ibyumba, ibiryo, n'ibindi bishimishije.",
  categories: [
    { key: "byose", label: "Byose" },
    { key: "ibyumba", label: "Ibyumba" },
    { key: "ibiryo", label: "Ibiryo" },
    { key: "spa", label: "Spa" },
    { key: "inyubako", label: "Inyubako" },
    { key: "ibirori", label: "Ibirori" },
  ],
  images: [
    {
      id: 1,
      src: "https://images.pexels.com/photos/34672504/pexels-photo-34672504.jpeg",
      alt: "Icyumba cyiza cy'ihoteli — Ifoto na Moussa Idrissi",
      category: "ibyumba",
      title: "Suite Cyiza",
    },
    {
      id: 2,
      src: "https://images.pexels.com/photos/5883728/pexels-photo-5883728.jpeg",
      alt: "Suite y'ubwiza — Ifoto na thiha soe",
      category: "ibyumba",
      title: "Suite y'Umuyobozi",
    },
    {
      id: 3,
      src: "https://images.pexels.com/photos/18285947/pexels-photo-18285947.jpeg",
      alt: "Suite ya Perezida — Ifoto na edithub pro",
      category: "ibyumba",
      title: "Suite ya Perezida",
    },
    {
      id: 4,
      src: "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg",
      alt: "Iresitora y'ihoteli — Ifoto na Chan Walrus",
      category: "ibiryo",
      title: "Iresitora Nyamukuru",
    },
    {
      id: 5,
      src: "https://images.pexels.com/photos/17294730/pexels-photo-17294730.jpeg",
      alt: "Imeza y'ifunguro — Ifoto na Matheus Bertelli",
      category: "ibiryo",
      title: "Ifunguro ry'Ijoro",
    },
    {
      id: 6,
      src: "https://images.pexels.com/photos/29051684/pexels-photo-29051684.jpeg",
      alt: "Imeza y'ifunguro n'amabati — Ifoto na Jonathan Borba",
      category: "ibiryo",
      title: "Imeza yo ku Rubaraza",
    },
    {
      id: 7,
      src: "https://images.unsplash.com/photo-1668751308263-e460277b26c7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw1fHxBZnJpY2FuJTIwc3BhJTIwd2VsbG5lc3MlMjB0cmVhdG1lbnQlMjByb29tJTIwd2l0aCUyMG5hdHVyYWwlMjBlbGVtZW50cyUyQyUyMHJlbGF4YXRpb24lMkMlMjBsdXh1cnklMjByZXNvcnR8ZW58MHwwfHx8MTc3MDkwNjQ3Mnww&ixlib=rb-4.1.0&q=85",
      alt: "Pisine ya Spa — Ifoto na Osni Shelby",
      category: "spa",
      title: "Spa y'Ubwiza",
    },
    {
      id: 8,
      src: "https://images.unsplash.com/photo-1649446326998-a16524cfa667?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBob3RlbCUyMGJhdGhyb29tJTIwbWFyYmxlJTIwYmF0aHR1YiUyMHdpdGglMjBmbG93ZXJzfGVufDB8MHx8fDE3NzA5MjAxMjd8MA&ixlib=rb-4.1.0&q=85",
      alt: "Ubwiherero bw'ubwiza — Ifoto na Rohit Tandon",
      category: "spa",
      title: "Ubwiherero bw'Isipurangi",
    },
    {
      id: 9,
      src: "https://images.pexels.com/photos/14036442/pexels-photo-14036442.jpeg",
      alt: "Inyubako y'ihoteli — Ifoto na Quang Nguyen Vinh",
      category: "inyubako",
      title: "Inyubako Nyamukuru",
    },
    {
      id: 10,
      src: "https://images.pexels.com/photos/28586227/pexels-photo-28586227.jpeg",
      alt: "Villa y'ihoteli n'ikinnyamazi — Ifoto na Jonathan Borba",
      category: "inyubako",
      title: "Villa n'Ikinnyamazi",
    },
    {
      id: 11,
      src: "https://images.pexels.com/photos/11669558/pexels-photo-11669558.jpeg",
      alt: "Pisine n'imisozi — Ifoto na Quang Nguyen Vinh",
      category: "inyubako",
      title: "Pisine y'Infinity",
    },
    {
      id: 12,
      src: "https://images.pexels.com/photos/31107317/pexels-photo-31107317.jpeg",
      alt: "Icyumba cy'inama — Ifoto na Newman Photographs",
      category: "ibirori",
      title: "Icyumba Kinini cy'Inama",
    },
    {
      id: 13,
      src: "https://images.pexels.com/photos/236730/pexels-photo-236730.jpeg",
      alt: "Icyumba cy'amahuriro — Ifoto na Pixabay",
      category: "ibirori",
      title: "Icyumba cy'Amahuriro",
    },
    {
      id: 14,
      src: "https://images.pexels.com/photos/19689229/pexels-photo-19689229.jpeg",
      alt: "Lounge ya Bar — Ifoto na Anthony Rahayel",
      category: "ibiryo",
      title: "Bar n'Lounge",
    },
    {
      id: 15,
      src: "https://images.pexels.com/photos/14011664/pexels-photo-14011664.jpeg",
      alt: "Isomero ry'ihoteli — Ifoto na Quang Nguyen Vinh",
      category: "inyubako",
      title: "Isomero Rikuru",
    },
    {
      id: 16,
      src: "https://images.unsplash.com/photo-1757924284732-4189190321cf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw3fHxtb2Rlcm4lMjBob3RlbCUyMGd5bSUyMGZpdG5lc3MlMjBjZW50ZXIlMjBlcXVpcG1lbnR8ZW58MHwwfHx8MTc3MDkyMDEyNnww&ixlib=rb-4.1.0&q=85",
      alt: "Gym y'ihoteli — Ifoto na Aalo Lens",
      category: "spa",
      title: "Ikigo cy'Imikino",
    },
  ],
};

export const contactContent = {
  sectionLabel: "Twandikire",
  title: "Twandikire",
  titleAccent: "Dukeneye Kukubwira",
  description: "Dufite umunezero wo gukemura ibibazo byawe byose. Twandikire kuri imwe mu nzira zikurikira:",
  form: {
    nameLabel: "Amazina Yawe",
    namePlaceholder: "Andika amazina yawe",
    emailLabel: "Imeli",
    emailPlaceholder: "Andika imeli yawe",
    phoneLabel: "Telefoni",
    phonePlaceholder: "+250 7XX XXX XXX",
    subjectLabel: "Ingingo",
    subjectPlaceholder: "Hitamo ingingo",
    subjectOptions: [
      "Gufata Icyumba",
      "Ibirori n'Inama",
      "Ibiryo n'Iresitora",
      "Spa n'Ubuzima",
      "Ikibazo Rusange",
      "Ikindi",
    ],
    messageLabel: "Ubutumwa",
    messagePlaceholder: "Andika ubutumwa bwawe hano...",
    submitText: "Ohereza Ubutumwa",
    successMessage: "Ubutumwa bwawe bwakiriwe! Tuzagusubiza vuba.",
  },
  info: {
    address: {
      title: "Aderesi",
      value: "KG 7 Ave, Kigali, Rwanda",
    },
    phone: {
      title: "Telefoni",
      value: "+250 788 000 000",
    },
    email: {
      title: "Imeli",
      value: "reservations@eastgatehotel.rw",
    },
    hours: {
      title: "Amasaha y'Akazi",
      value: "Buri munsi: 24/7",
    },
  },
  socialTitle: "Dukurikire",
};

export const testimonialsKw = [
  {
    id: 1,
    quote:
      "Kwitabira buri kintu muri EastGate birashimishije. Kuva igihe twageze, buri kintu cy'icyumba cyacu cyari cyiza. Isura y'imisozi mu gitondo ntizigera yibagiranwa.",
    name: "Sarah Mitchell",
    title: "Umugenzi w'Amahanga",
    avatar: "https://i.pravatar.cc/80?u=sarah-mitchell",
    rating: 5,
  },
  {
    id: 2,
    quote:
      "Inyubako itangaje rwose. Ihuriza umuco w'Abanyafurika n'ubwiza bwa none nta nenge. Imiti ya spa yari ikintu cyiza cyane mu rugendo rwacu.",
    name: "James Okafor",
    title: "Umwanditsi w'Urugendo",
    avatar: "https://i.pravatar.cc/80?u=james-okafor",
    rating: 5,
  },
  {
    id: 3,
    quote:
      "Twateguye inama y'isosiyete yacu hano kandi byose byarenze ibyo twari twiteze. Ibikoresho by'amahuriro ni iby'isi yose kandi itsinda ryari ridasanzwe.",
    name: "Amara Chen",
    title: "Umuyobozi w'Ibirori",
    avatar: "https://i.pravatar.cc/80?u=amara-chen",
    rating: 5,
  },
];

export const footerLinksKw = [
  { label: "Twebwe", href: "/about" },
  { label: "Ibyumba n'Amasuite", href: "/rooms" },
  { label: "Ibiryo", href: "/dining" },
  { label: "Spa n'Ubuzima", href: "/spa" },
  { label: "Ibirori", href: "/events" },
  { label: "Amafoto", href: "/gallery" },
  { label: "Twandikire", href: "/contact" },
];

export const footerContent = {
  brand: {
    description:
      "Ubwiza bwo kwakira abashyitsi mu mutima wa Afurika. Aho buri gusura kuvuga inkuru y'ubwiza, umuco, n'uburambe butazibagirana.",
  },
  quickLinks: "Aho Uhita",
  contactTitle: "Twandikire",
  newsletterTitle: "Amakuru",
  newsletterDescription: "Iyandikishe kugira ngo ubone ibiciro bidasanzwe n'amakuru mashya.",
  emailPlaceholder: "Andika imeli yawe",
  copyright: "© 2026 EastGate Hotel Rwanda. Uburenganzira bwose bwabitswe.",
};

export const ctaContent = {
  title: "Tangira",
  titleAccent: "Urugendo Rwawe",
  description:
    "Ibiciro byihariye bishoboka ku gutanga ibiciro byo mu buryo butaziguye. Shakira ubunararibonye bw'u Rwanda mu buhumure butashobora guhura n'ubundi.",
  ctaText: "Gufata — Igiciro Cyiza Kiremezwa",
};
