// ═══════════════════════════════════════════════════════════════
// EastGate Hotel — Full i18n Translation Dictionary (EN / RW)
// ═══════════════════════════════════════════════════════════════

export type Locale = "en" | "rw";

export const translations = {
  // ─── Common / Shared ───────────────────────────────────────
  common: {
    appName: { en: "EastGate Hotel", rw: "EastGate Hotel" },
    brandTagline: { en: "Luxury in the Heart of Africa", rw: "Ubwiza mu Mutima wa Afurika" },
    search: { en: "Search", rw: "Shakisha" },
    filter: { en: "Filter", rw: "Shungura" },
    sort: { en: "Sort", rw: "Tegura" },
    all: { en: "All", rw: "Byose" },
    save: { en: "Save", rw: "Bika" },
    cancel: { en: "Cancel", rw: "Hagarika" },
    confirm: { en: "Confirm", rw: "Emeza" },
    delete: { en: "Delete", rw: "Siba" },
    edit: { en: "Edit", rw: "Hindura" },
    view: { en: "View", rw: "Reba" },
    close: { en: "Close", rw: "Funga" },
    back: { en: "Back", rw: "Subira Inyuma" },
    next: { en: "Next", rw: "Komeza" },
    continue: { en: "Continue", rw: "Komeza" },
    submit: { en: "Submit", rw: "Ohereza" },
    loading: { en: "Loading...", rw: "Birimo gutunganywa..." },
    noResults: { en: "No results found", rw: "Nta bisubizo byabonetse" },
    perNight: { en: "per night", rw: "ku ijoro" },
    nights: { en: "nights", rw: "amajoro" },
    night: { en: "night", rw: "ijoro" },
    guests: { en: "guests", rw: "abashyitsi" },
    guest: { en: "guest", rw: "umushyitsi" },
    total: { en: "Total", rw: "Igiteranyo" },
    items: { en: "items", rw: "ibintu" },
    more: { en: "more", rw: "ibindi" },
    available: { en: "Available", rw: "Biraboneka" },
    unavailable: { en: "Unavailable", rw: "Ntibiboneka" },
    popular: { en: "Popular", rw: "Bikunzwe" },
    new: { en: "New", rw: "Bishya" },
    today: { en: "Today", rw: "Uyu munsi" },
    welcome: { en: "Welcome", rw: "Murakaze" },
    dashboard: { en: "Dashboard", rw: "Ikibaho" },
    settings: { en: "Settings", rw: "Igenamiterere" },
    logout: { en: "Logout", rw: "Gusohoka" },
    language: { en: "Language", rw: "Ururimi" },
    english: { en: "English", rw: "Icyongereza" },
    kinyarwanda: { en: "Kinyarwanda", rw: "Ikinyarwanda" },
    yes: { en: "Yes", rw: "Yego" },
    no: { en: "No", rw: "Oya" },
    actions: { en: "Actions", rw: "Ibikorwa" },
    status: { en: "Status", rw: "Imimerere" },
    date: { en: "Date", rw: "Itariki" },
    time: { en: "Time", rw: "Isaha" },
    amount: { en: "Amount", rw: "Igiciro" },
    price: { en: "Price", rw: "Igiciro" },
    details: { en: "Details", rw: "Ibisobanuro" },
    description: { en: "Description", rw: "Igisobanuro" },
    name: { en: "Name", rw: "Izina" },
    email: { en: "Email", rw: "Imeli" },
    phone: { en: "Phone", rw: "Telefoni" },
    address: { en: "Address", rw: "Aderesi" },
    notes: { en: "Notes", rw: "Ibisobanuro" },
    room: { en: "Room", rw: "Icyumba" },
    rooms: { en: "Rooms", rw: "Ibyumba" },
    branch: { en: "Branch", rw: "Ishami" },
    branches: { en: "Branches", rw: "Amashami" },
    allBranches: { en: "All Branches", rw: "Amashami Yose" },
    staff: { en: "Staff", rw: "Abakozi" },
    reports: { en: "Reports", rw: "Raporo" },
    messages: { en: "Messages", rw: "Ubutumwa" },
    notifications: { en: "Notifications", rw: "Amakuru" },
    performance: { en: "Performance", rw: "Imikorere" },
    services: { en: "Services", rw: "Serivisi" },
    orders: { en: "Orders", rw: "Ibisabwa" },
    bookings: { en: "Bookings", rw: "Gufata Ibyumba" },
    menu: { en: "Menu", rw: "Imenyetso y'Ibiryo" },
    tables: { en: "Tables", rw: "Ameza" },
    revenue: { en: "Revenue", rw: "Amafaranga Yinjiye" },
    occupancy: { en: "Occupancy", rw: "Ikuzuzwa" },
    analytics: { en: "Analytics", rw: "Isesengura" },
    overview: { en: "Overview", rw: "Incamake" },
    manage: { en: "Manage", rw: "Gucunga" },
    add: { en: "Add", rw: "Ongeraho" },
    update: { en: "Update", rw: "Hindura" },
    remove: { en: "Remove", rw: "Kuraho" },
    active: { en: "Active", rw: "Birakora" },
    inactive: { en: "Inactive", rw: "Ntibirakora" },
    completed: { en: "Completed", rw: "Byarangiye" },
    pending: { en: "Pending", rw: "Bitegereje" },
    inProgress: { en: "In Progress", rw: "Birimo Gukorwa" },
    urgent: { en: "Urgent", rw: "Byihutirwa" },
    high: { en: "High", rw: "Hejuru" },
    medium: { en: "Medium", rw: "Hagati" },
    low: { en: "Low", rw: "Hasi" },
  },

  // ─── Navigation ─────────────────────────────────────────────
  nav: {
    home: { en: "Home", rw: "Ahabanza" },
    about: { en: "About", rw: "Twebwe" },
    rooms: { en: "Rooms", rw: "Ibyumba" },
    dining: { en: "Dining", rw: "Ibiryo" },
    spa: { en: "Spa", rw: "Spa" },
    events: { en: "Events", rw: "Ibirori" },
    gallery: { en: "Gallery", rw: "Amafoto" },
    contact: { en: "Contact", rw: "Twandikire" },
    bookRoom: { en: "Book a Room", rw: "Gufata Icyumba" },
    viewMenu: { en: "View Menu", rw: "Reba Imenyetso" },
    preOrder: { en: "Pre-Order", rw: "Gufata Mbere" },
  },

  // ─── Booking Page ───────────────────────────────────────────
  booking: {
    title: { en: "Reserve Your Perfect Room", rw: "Fata Icyumba Cyawe Kiza" },
    subtitle: { en: "Experience luxury across our stunning locations in Rwanda", rw: "Shakira ubwiza mu hantu hacu heza mu Rwanda" },
    bookYourStay: { en: "Book Your Stay", rw: "Fata Ahantu Hawe" },

    // Steps
    step1: { en: "Dates & Guests", rw: "Amatariki n'Abashyitsi" },
    step2: { en: "Select Room", rw: "Hitamo Icyumba" },
    step3: { en: "Add-Ons", rw: "Serivisi Zinyongera" },
    step4: { en: "Your Info", rw: "Amakuru Yawe" },
    step5: { en: "Payment", rw: "Kwishyura" },
    step6: { en: "Confirmed", rw: "Byemejwe" },

    // Step 1
    selectBranch: { en: "Select Branch Location", rw: "Hitamo Ishami" },
    chooseBranch: { en: "Choose your preferred location", rw: "Hitamo aho ukunda" },
    checkInDate: { en: "Check-in Date", rw: "Itariki yo Kwinjira" },
    checkOutDate: { en: "Check-out Date", rw: "Itariki yo Gusohoka" },
    selectDate: { en: "Select date", rw: "Hitamo itariki" },
    stayDuration: { en: "night stay", rw: "amajoro yo kurara" },
    numberOfGuests: { en: "Number of Guests", rw: "Umubare w'Abashyitsi" },
    adults: { en: "Adults", rw: "Abakuru" },
    children: { en: "Children", rw: "Abana" },
    totalGuests: { en: "Total", rw: "Bose hamwe" },

    // Step 2
    searchRooms: { en: "Search rooms by name or type...", rw: "Shakisha ibyumba ku izina cyangwa ubwoko..." },
    allPrices: { en: "All Prices", rw: "Ibiciro Byose" },
    budget: { en: "Budget", rw: "Igiciro Gito" },
    mid: { en: "Mid-Range", rw: "Igiciro Hagati" },
    luxury: { en: "Luxury", rw: "Ubwiza Buhenze" },
    priceLowHigh: { en: "Price: Low → High", rw: "Igiciro: Gito → Kinini" },
    priceHighLow: { en: "Price: High → Low", rw: "Igiciro: Kinini → Gito" },
    maxCapacity: { en: "Max Capacity", rw: "Umubare Ntarengwa" },
    roomSize: { en: "Room Size", rw: "Ingano y'Icyumba" },
    showingRooms: { en: "Showing", rw: "Bigaragara" },
    roomTypes: { en: "room types", rw: "ubwoko bw'ibyumba" },
    forGuests: { en: "for", rw: "ku bashyitsi" },
    at: { en: "at", rw: "kuri" },
    roomsAvailable: { en: "rooms available", rw: "ibyumba biboneka" },
    roomAvailable: { en: "room available", rw: "icyumba kiboneka" },
    limitedAvailability: { en: "Limited availability", rw: "Byasigaye bike" },
    upTo: { en: "Up to", rw: "Kugeza kuri" },
    noRoomsFound: { en: "No rooms found matching your criteria", rw: "Nta byumba byabonetse bihuye n'ibyo ushaka" },
    adjustFilters: { en: "Try adjusting your filters or guest count", rw: "Gerageza guhindura ibyo ushungura cyangwa umubare w'abashyitsi" },

    // Step 3
    enhanceStay: { en: "Enhance Your Stay", rw: "Ongeraho ku Kurara Kwawe" },
    selectServices: { en: "Select additional services for your booking", rw: "Hitamo serivisi zinyongera ku ifatwa ryawe" },
    specialRequests: { en: "Special Requests & Needs", rw: "Ibyifuzo Bidasanzwe" },
    specialRequestsPlaceholder: {
      en: "Any dietary requirements, allergies, accessibility needs, room preferences, celebration notes...",
      rw: "Ibyifuzo ku biryo, allergie, ibyo ukeneye ku buryo bwo kugera, ibyifuzo by'icyumba, amanota y'ibirori..."
    },
    preOrderMenu: { en: "Pre-Order from Our Menu", rw: "Fata Mbere mu Imenyetso Yacu" },
    preOrderDesc: { en: "Add food & drinks to have them ready when you arrive", rw: "Ongeraho ibiryo n'ibinyobwa kugira ngo bitegurwe ugeze" },
    browseMenu: { en: "Browse Menu & Pre-Order", rw: "Reba Imenyetso & Fata Mbere" },
    updateMenuOrder: { en: "Update Menu Order", rw: "Hindura Ibyo Wafashe" },

    // Step 4
    fullName: { en: "Full Name", rw: "Amazina Yuzuye" },
    enterFullName: { en: "Enter your full name", rw: "Andika amazina yawe yuzuye" },
    emailAddress: { en: "Email Address", rw: "Aderesi y'Imeli" },
    phoneNumber: { en: "Phone Number", rw: "Nimero ya Telefoni" },
    nationality: { en: "Nationality", rw: "Ubwenegihugu" },
    selectNationality: { en: "Select your nationality", rw: "Hitamo ubwenegihugu bwawe" },
    bookingSummary: { en: "Booking Summary", rw: "Incamake y'Ifatwa" },
    location: { en: "Location", rw: "Aho Biherereye" },
    stay: { en: "Stay", rw: "Kurara" },

    // Step 5
    onlinePaymentOnly: { en: "Online Payment Only", rw: "Kwishyura kuri Interineti Gusa" },
    onlinePaymentDesc: {
      en: "All payments are processed securely online. Cash payments are not accepted for advance bookings.",
      rw: "Amahera yose yishyurwa ku buryo bwizewe kuri interineti. Kwishyura amafaranga y'ikiganza ntibyemewe ku mafatwa ya mbere."
    },
    selectPayment: { en: "Select Payment Method", rw: "Hitamo Uburyo bwo Kwishyura" },
    cardDetails: { en: "Card Details", rw: "Amakuru ya Karita" },
    cardNumber: { en: "Card Number", rw: "Nimero ya Karita" },
    expiryDate: { en: "Expiry Date", rw: "Itariki y'Irangira" },
    mobileNumber: { en: "Mobile Number", rw: "Nimero ya Telefoni" },
    mobilePayPrompt: {
      en: "You will receive a payment prompt on your phone. Please approve to complete the booking.",
      rw: "Uzabona ubutumwa bwo kwishyura kuri telefoni yawe. Nyamuneka emeza kugira ngo urangize ifatwa."
    },
    bankTransfer: { en: "Bank Transfer Details", rw: "Amakuru yo Kwishyura mu Banki" },
    bankName: { en: "Bank", rw: "Banki" },
    accountName: { en: "Account Name", rw: "Izina ry'Konti" },
    accountNumber: { en: "Account Number", rw: "Nimero y'Ikonti" },
    swiftCode: { en: "SWIFT Code", rw: "Kode ya SWIFT" },
    bankTransferNote: {
      en: "After transfer, your booking will be confirmed once payment is verified (within 2 hours).",
      rw: "Nyuma yo kohereza, ifatwa ryawe rizemezwa iyo kwishyura kwemejwe (mu masaha 2)."
    },
    paymentSummary: { en: "Payment Summary", rw: "Incamake y'Ubwishyu" },
    addOnServices: { en: "Add-on services", rw: "Serivisi zinyongera" },
    menuPreOrder: { en: "Menu pre-order", rw: "Ifunguro ryafashwe mbere" },
    processing: { en: "Processing...", rw: "Birimo gutunganywa..." },
    pay: { en: "Pay", rw: "Ishyura" },

    // Step 6
    bookingConfirmed: { en: "Booking Confirmed!", rw: "Ifatwa Ryemejwe!" },
    reservationSuccess: { en: "Your reservation has been successfully processed", rw: "Ifatwa ryawe ryatunganijwe neza" },
    bookingReference: { en: "Booking Reference", rw: "Nimero y'Ifatwa" },
    bookingDetails: { en: "Booking Details", rw: "Amakuru y'Ifatwa" },
    checkIn: { en: "Check-in", rw: "Kwinjira" },
    checkOut: { en: "Check-out", rw: "Gusohoka" },
    payment: { en: "Payment", rw: "Kwishyura" },
    addOns: { en: "Add-ons", rw: "Serivisi Zinyongera" },
    totalPaid: { en: "Total Paid", rw: "Igiteranyo Cyishyuwe" },
    confirmationEmail: { en: "Confirmation Email Sent", rw: "Imeli y'Icyemeso Yoherejwe" },
    confirmationEmailDesc: {
      en: "A confirmation email with full booking details has been sent to",
      rw: "Imeli y'icyemeso ifite amakuru yuzuye y'ifatwa yoherejwe kuri"
    },
    bookAnother: { en: "Book Another Stay", rw: "Fata Ikindi Cyumba" },

    // Trust Features
    securePayment: { en: "Secure Payment", rw: "Kwishyura Kwizewe" },
    securePaymentDesc: { en: "256-bit encrypted", rw: "Byahinduwemo amategeko 256-bit" },
    instantConfirmation: { en: "Instant Confirmation", rw: "Kwemeza Vuba" },
    instantConfirmationDesc: { en: "Confirmed in seconds", rw: "Byemejwe mu masegonda" },
    bestRate: { en: "Best Rate", rw: "Igiciro Cyiza" },
    bestRateDesc: { en: "Price match guarantee", rw: "Igiciro kiza kiremezwa" },
    premiumService: { en: "Premium Service", rw: "Serivisi Nziza Cyane" },
    premiumServiceDesc: { en: "5-star experience", rw: "Uburambe bw'Inyenyeri 5" },

    // Validation
    pleaseSelectBranch: { en: "Please select a branch location", rw: "Nyamuneka hitamo ishami" },
    pleaseSelectCheckIn: { en: "Please select a check-in date", rw: "Nyamuneka hitamo itariki yo kwinjira" },
    pleaseSelectCheckOut: { en: "Please select a check-out date", rw: "Nyamuneka hitamo itariki yo gusohoka" },
    checkOutAfterCheckIn: { en: "Check-out must be after check-in", rw: "Itariki yo gusohoka igomba kuba nyuma yo kwinjira" },
    pleaseSelectRoom: { en: "Please select a room type", rw: "Nyamuneka hitamo ubwoko bw'icyumba" },
    pleaseEnterName: { en: "Please enter your full name", rw: "Nyamuneka andika amazina yawe" },
    pleaseEnterEmail: { en: "Please enter a valid email", rw: "Nyamuneka andika imeli yuzuye" },
    pleaseEnterPhone: { en: "Please enter your phone number", rw: "Nyamuneka andika nimero ya telefoni" },
    pleaseEnterCard: { en: "Please enter a valid card number", rw: "Nyamuneka andika nimero ya karita yuzuye" },
    pleaseEnterExpiry: { en: "Please enter card expiry date", rw: "Nyamuneka andika itariki y'irangira" },
    pleaseEnterCvv: { en: "Please enter CVV", rw: "Nyamuneka andika CVV" },
    pleaseEnterMobile: { en: "Please enter your mobile number", rw: "Nyamuneka andika nimero ya telefoni" },
    paymentSuccess: { en: "Payment processed successfully!", rw: "Kwishyura byagenze neza!" },
  },

  // ─── Menu Page ──────────────────────────────────────────────
  menuPage: {
    title: { en: "Our Full Menu", rw: "Imenyetso Yacu Yuzuye" },
    subtitle: {
      en: "Explore our carefully crafted dishes and beverages from the finest Rwandan and international cuisines",
      rw: "Shakisha ibiryo n'ibinyobwa byacu byubatswe neza bivuye mu bitunguru byiza by'u Rwanda n'isi yose"
    },
    searchPlaceholder: { en: "Search dishes, drinks...", rw: "Shakisha ibiryo, ibinyobwa..." },
    categories: { en: "Categories", rw: "Amoko" },
    allItems: { en: "All Items", rw: "Ibintu Byose" },
    addToOrder: { en: "Add to Order", rw: "Ongeraho mu Bifashwe" },
    addToCart: { en: "Add to Cart", rw: "Shyira mu Gatebo" },
    viewOrder: { en: "View Order", rw: "Reba Ibifashwe" },
    orderNow: { en: "Order Now", rw: "Fata Nonaha" },
    clearCart: { en: "Clear Cart", rw: "Kuraho Byose" },
    yourOrder: { en: "Your Order", rw: "Ibyo Wafashe" },
    orderSummary: { en: "Order Summary", rw: "Incamake y'Ibifashwe" },
    subtotal: { en: "Subtotal", rw: "Igiteranyo Gito" },
    proceedToCheckout: { en: "Proceed to Checkout", rw: "Komeza Kwishyura" },
    emptyCart: { en: "Your cart is empty", rw: "Agatebo kawe ni ubusa" },
    emptyCartDesc: { en: "Browse our menu and add items to get started", rw: "Reba imenyetso yacu wongeremo ibintu" },
    dietaryFilters: { en: "Dietary Filters", rw: "Shungura ku Mirire" },
    vegetarian: { en: "Vegetarian", rw: "Imboga" },
    vegan: { en: "Vegan", rw: "Imboga Gusa" },
    spicy: { en: "Spicy", rw: "Biryoshye" },
    glutenFree: { en: "Gluten Free", rw: "Nta Gluten" },
    halal: { en: "Halal", rw: "Halal" },
    itemsFound: { en: "items found", rw: "ibintu byabonetse" },
    noItemsFound: { en: "No menu items found", rw: "Nta biryo byabonetse" },
    tryDifferent: { en: "Try a different search or category", rw: "Gerageza gushakisha ikindi cyangwa ubwoko" },
    preOrderInfo: {
      en: "Pre-order your meals to have them ready when you arrive",
      rw: "Fata ibiryo mbere kugira ngo bitegurwe ugeze"
    },
    placePreOrder: { en: "Place Pre-Order", rw: "Fata Mbere" },
    bookAndOrder: { en: "Book Room & Pre-Order", rw: "Fata Icyumba & Ibiryo" },
    inCart: { en: "in cart", rw: "mu gatebo" },
  },

  // ─── Room Types ─────────────────────────────────────────────
  roomTypes: {
    standard: { en: "Standard Room", rw: "Icyumba Gisanzwe" },
    deluxe: { en: "Deluxe Room", rw: "Icyumba Cyiza" },
    family: { en: "Family Suite", rw: "Suite y'Umuryango" },
    executive_suite: { en: "Executive Suite", rw: "Suite y'Umuyobozi" },
    presidential_suite: { en: "Presidential Suite", rw: "Suite ya Perezida" },
  },

  // ─── Room Descriptions ──────────────────────────────────────
  roomDesc: {
    standard: {
      en: "Comfortable room with essential amenities, perfect for solo travelers or couples.",
      rw: "Icyumba gifite ibikoresho byose, cyiza ku bigendera bonyine cyangwa abakundana."
    },
    deluxe: {
      en: "Spacious comfort with panoramic views, premium bedding, and marble bathroom.",
      rw: "Ubuhumure bwagutse bufite isura nziza, uburiri bwiza, n'ubwiherero bw'amabuye."
    },
    family: {
      en: "Large suite perfect for families, with separate living area and kid-friendly amenities.",
      rw: "Suite nini yiza ku miryango, ifite ahantu ho guturana hatandukanye n'ibikoresho byiza ku bana."
    },
    executive_suite: {
      en: "Luxury suite with separate work space, premium amenities, and butler service.",
      rw: "Suite y'ubwiza ifite ahantu ho gukora, ibikoresho byiza, na serivisi y'umukozi."
    },
    presidential_suite: {
      en: "The pinnacle of luxury — expansive spaces, private dining, and bespoke concierge services.",
      rw: "Igipimo cyo hejuru cy'ubwiza — ahantu hagutse, ifunguro ry'umwihariye, na serivisi zidasanzwe."
    },
  },

  // ─── Add-on Services ────────────────────────────────────────
  addOns: {
    airport_pickup: { en: "Airport Pickup", rw: "Guhura ku Kibuga" },
    airport_pickupDesc: { en: "Private car from Kigali International Airport", rw: "Imodoka yihariye kuva ku Kibuga cy'Amahanga cya Kigali" },
    airport_dropoff: { en: "Airport Drop-off", rw: "Kujyana ku Kibuga" },
    airport_dropoffDesc: { en: "Private car to Kigali International Airport", rw: "Imodoka yihariye kujya ku Kibuga cy'Amahanga cya Kigali" },
    late_checkout: { en: "Late Check-Out (2 PM)", rw: "Gusohoka Buhoro (2 PM)" },
    late_checkoutDesc: { en: "Extend your stay until 2:00 PM", rw: "Ongeraho igihe cyawe kugeza saa 8 z'amanywa" },
    early_checkin: { en: "Early Check-In (10 AM)", rw: "Kwinjira Kare (10 AM)" },
    early_checkinDesc: { en: "Arrive and check in from 10:00 AM", rw: "Gera kandi winjire kuva saa 4 z'igitondo" },
    extra_bed: { en: "Extra Bed", rw: "Uburiri Bwongeyeho" },
    extra_bedDesc: { en: "Additional bed added to your room", rw: "Uburiri bwongewaho mu cyumba cyawe" },
    breakfast: { en: "Daily Breakfast", rw: "Ifunguro rya Buri Gitondo" },
    breakfastDesc: { en: "Full buffet breakfast per person per day", rw: "Ifunguro rya bifeti buri muntu ku munsi" },
    spa_package: { en: "Spa Package", rw: "Gahunda ya Spa" },
    spa_packageDesc: { en: "90-min signature massage + facial", rw: "Gukanda iminota 90 + gutera mu maso" },
    tour_package: { en: "City Tour Package", rw: "Gahunda yo Gusura Umujyi" },
    tour_packageDesc: { en: "Half-day guided tour of Kigali highlights", rw: "Gusura ahantu heza ha Kigali igice cy'umunsi" },
    honeymoon_decor: { en: "Honeymoon Decoration", rw: "Gushushanya Honeymoon" },
    honeymoon_decorDesc: { en: "Rose petals, candles, champagne setup", rw: "Amababi y'imbuto, amashanini, shampayi" },
    gym_access: { en: "Premium Gym Access", rw: "Kwinjira mu Kigo cy'Imikino" },
    gym_accessDesc: { en: "Full access to fitness center per day", rw: "Kwinjira byuzuye mu kigo cy'imikino ku munsi" },
  },

  // ─── Payment Methods ────────────────────────────────────────
  paymentMethods: {
    visa: { en: "Visa", rw: "Visa" },
    mastercard: { en: "Mastercard", rw: "Mastercard" },
    stripe: { en: "Stripe", rw: "Stripe" },
    mtn_mobile: { en: "MTN MoMo", rw: "MTN MoMo" },
    airtel_money: { en: "Airtel Money", rw: "Airtel Money" },
    bank_transfer: { en: "Bank Transfer", rw: "Kohereza mu Banki" },
    cash: { en: "Cash", rw: "Amafaranga" },
  },

  // ─── Statuses ───────────────────────────────────────────────
  statuses: {
    pending: { en: "Pending", rw: "Bitegereje" },
    confirmed: { en: "Confirmed", rw: "Byemejwe" },
    checked_in: { en: "Checked In", rw: "Bwinjiye" },
    checked_out: { en: "Checked Out", rw: "Bwasohotse" },
    cancelled: { en: "Cancelled", rw: "Byahagaritswe" },
    refunded: { en: "Refunded", rw: "Byasubijwe" },
    preparing: { en: "Preparing", rw: "Birimo Gutegurwa" },
    ready: { en: "Ready", rw: "Byateguwe" },
    served: { en: "Served", rw: "Byatanzwe" },
    available: { en: "Available", rw: "Biraboneka" },
    occupied: { en: "Occupied", rw: "Bikoreshwa" },
    cleaning: { en: "Cleaning", rw: "Birimo Gusukurwa" },
    maintenance: { en: "Maintenance", rw: "Birimo Gukosorwa" },
    reserved: { en: "Reserved", rw: "Byafashwe" },
    in_progress: { en: "In Progress", rw: "Birimo Gukorwa" },
  },

  // ─── Dashboard (Manager/Waiter/Receptionist/Admin) ──────────
  dashboard: {
    welcomeBack: { en: "Welcome back", rw: "Murakaze Nanone" },
    managerDashboard: { en: "Branch Manager Dashboard", rw: "Ikibaho cy'Umuyobozi w'Ishami" },
    superManagerDashboard: { en: "Super Manager Dashboard", rw: "Ikibaho cy'Umuyobozi Mukuru" },
    waiterDashboard: { en: "Waiter Dashboard", rw: "Ikibaho cy'Umukozi w'Iresitora" },
    receptionistDashboard: { en: "Reception Desk", rw: "Ibiro byo Kwakira" },
    adminDashboard: { en: "Admin Dashboard", rw: "Ikibaho cy'Umunyamabanga Mukuru" },

    totalRevenue: { en: "Total Revenue", rw: "Amafaranga Yose Yinjiye" },
    occupancyRate: { en: "Occupancy Rate", rw: "Igipimo cy'Ikuzuzwa" },
    activeStaff: { en: "Active Staff", rw: "Abakozi Bahari" },
    restaurantRevenue: { en: "Restaurant Revenue", rw: "Amafaranga y'Iresitora" },
    pendingRequests: { en: "Pending Requests", rw: "Ibisabwa Bitegereje" },
    activeOrders: { en: "Active Orders", rw: "Ibisabwa Biri mu Bikorwa" },
    occupiedTables: { en: "Occupied Tables", rw: "Ameza Akoreshwa" },
    todayRevenue: { en: "Today's Revenue", rw: "Amafaranga y'Uyu munsi" },
    pendingOrders: { en: "Pending Orders", rw: "Ibisabwa Bitegereje" },
    preparingOrders: { en: "Preparing", rw: "Birimo Gutegurwa" },
    readyOrders: { en: "Ready to Serve", rw: "Biteguye Gutangwa" },

    manageStaff: { en: "Manage Staff", rw: "Gucunga Abakozi" },
    viewAnalytics: { en: "View Analytics", rw: "Reba Isesengura" },
    tableMap: { en: "Table Map", rw: "Ikarita y'Ameza" },
    newOrder: { en: "New Order", rw: "Icyifuzo Gishya" },
    liveOrders: { en: "Live Orders", rw: "Ibisabwa bya Nonaha" },
    recentBookings: { en: "Recent Bookings", rw: "Amafatwa Mashya" },

    // Guest Management
    registerGuest: { en: "Register Guest", rw: "Kwandika Umushyitsi" },
    checkInGuest: { en: "Check In", rw: "Kwinjiza" },
    checkOutGuest: { en: "Check Out", rw: "Gusohoza" },
    guestList: { en: "Guest List", rw: "Urutonde rw'Abashyitsi" },
    activeGuests: { en: "Active Guests", rw: "Abashyitsi Bahari" },

    // Orders Management
    ordersManagement: { en: "Orders Management", rw: "Gucunga Ibisabwa" },
    monitorOrders: { en: "Monitor and manage all restaurant orders", rw: "Gukurikirana no gucunga ibisabwa byose by'iresitora" },
    allOrders: { en: "All branch orders", rw: "Ibisabwa byose by'ishami" },
    sharedView: { en: "Shared view for all waiters", rw: "Igaragara ku bakozi bose" },
    markPreparing: { en: "Mark Preparing", rw: "Shyira Bitegurwa" },
    markReady: { en: "Mark Ready", rw: "Shyira Biteguwe" },
    markServed: { en: "Mark Served", rw: "Shyira Byatanzwe" },

    // Bookings Management
    bookingsManagement: { en: "Bookings Management", rw: "Gucunga Amafatwa" },
    viewManageBookings: { en: "View and manage all guest bookings", rw: "Reba no gucunga amafatwa yose y'abashyitsi" },
  },

  // ─── Menu Categories ────────────────────────────────────────
  menuCategories: {
    "bitangura-byoshye": { en: "Hot Starters", rw: "Bitangura Byoshye" },
    "inyama-yinka": { en: "Beef", rw: "Inyama y'Inka" },
    inkoko: { en: "Chicken", rw: "Inkoko" },
    ifi: { en: "Fish", rw: "Ifi" },
    "ibidasanzwe-akabenzi": { en: "Specials - Akabenzi", rw: "Ibidasanzwe - Akabenzi" },
    "ibidasanzwe-agatogo": { en: "Specials - Agatogo", rw: "Ibidasanzwe - Agatogo" },
    pasta: { en: "Pasta", rw: "Pasta" },
    sandwich: { en: "Sandwiches", rw: "Sandwich" },
    barbeque: { en: "Barbeque", rw: "Barbeque" },
    "ibigize-ifunguro": { en: "Accompaniments", rw: "Ibigize Ifunguro" },
    ibinywabura: { en: "Desserts", rw: "Ibinywabura" },
    "ifunguro-ryo-mu-gitondo": { en: "Breakfast", rw: "Ifunguro ryo mu gitondo" },
    bifeti: { en: "Buffet", rw: "Bifeti" },
    wines: { en: "Wines", rw: "Vino" },
    spirits: { en: "Spirits", rw: "Spirits" },
    "ibinyobwa-byoroshye": { en: "Soft Drinks", rw: "Ibinyobwa Byoroshye" },
    "ibinyobwa-byoshye": { en: "Hot Beverages", rw: "Ibinyobwa Byoshye" },
    snacks: { en: "Snacks", rw: "Snacks" },
  },
} as const;

// Type helper to get a translation value
export type TranslationKey = keyof typeof translations;
export type TranslationSubKey<T extends TranslationKey> = keyof (typeof translations)[T];
