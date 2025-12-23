/**
 * Nigerian States and Local Government Areas (LGAs)
 * Focused on Northern Nigeria states
 */

export interface State {
  name: string;
  code: string;
  lgas: string[];
}

export const NIGERIAN_STATES: State[] = [
  {
    name: "Adamawa",
    code: "AD",
    lgas: [
      "Demsa", "Fufure", "Ganye", "Girei", "Gombi", "Guyuk", "Hong", "Jada", "Lamurde", 
      "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", 
      "Shelleng", "Song", "Toungo", "Yola North", "Yola South"
    ]
  },
  {
    name: "Bauchi",
    code: "BA",
    lgas: [
      "Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", 
      "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", 
      "Tafawa Balewa", "Toro", "Warji", "Zaki"
    ]
  },
  {
    name: "Benue",
    code: "BE",
    lgas: [
      "Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", 
      "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", 
      "Ohimini", "Oju", "Okpokwu", "Otukpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"
    ]
  },
  {
    name: "Borno",
    code: "BO",
    lgas: [
      "Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", 
      "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", 
      "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", 
      "Monguno", "Ngala", "Nganzai", "Shani"
    ]
  },
  {
    name: "Gombe",
    code: "GO",
    lgas: [
      "Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", 
      "Nafada", "Shongom", "Yamaltu/Deba"
    ]
  },
  {
    name: "Jigawa",
    code: "JI",
    lgas: [
      "Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki", 
      "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kazaure", 
      "Kiri Kasama", "Kiyawa", "Kaugama", "Maigatari", "Malam Madori", "Miga", "Ringim", 
      "Roni", "Sule Tankarkar", "Taura", "Yankwashi"
    ]
  },
  {
    name: "Kaduna",
    code: "KD",
    lgas: [
      "Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", 
      "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", 
      "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"
    ]
  },
  {
    name: "Kano",
    code: "KN",
    lgas: [
      "Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", 
      "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Mallam", 
      "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", 
      "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nasarawa", 
      "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", 
      "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"
    ]
  },
  {
    name: "Katsina",
    code: "KT",
    lgas: [
      "Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", 
      "Danja", "Dan Musa", "Daura", "Dutsi", "Dutsin Ma", "Faskari", "Funtua", "Ingawa", 
      "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", 
      "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", 
      "Safana", "Sandamu", "Zango"
    ]
  },
  {
    name: "Kebbi",
    code: "KE",
    lgas: [
      "Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Bunza", "Dandi", "Fakai", 
      "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", 
      "Suru", "Wasagu/Danko", "Yauri", "Zuru"
    ]
  },
  {
    name: "Kwara",
    code: "KW",
    lgas: [
      "Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", 
      "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", 
      "Pategi"
    ]
  },
  {
    name: "Nasarawa",
    code: "NA",
    lgas: [
      "Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", 
      "Nasarawa Egon", "Obi", "Toto", "Wamba"
    ]
  },
  {
    name: "Niger",
    code: "NI",
    lgas: [
      "Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", 
      "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", 
      "Mokwa", "Moya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"
    ]
  },
  {
    name: "Plateau",
    code: "PL",
    lgas: [
      "Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South", "Kanam", 
      "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", 
      "Riyom", "Shendam", "Wase"
    ]
  },
  {
    name: "Sokoto",
    code: "SO",
    lgas: [
      "Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", 
      "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", 
      "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"
    ]
  },
  {
    name: "Taraba",
    code: "TA",
    lgas: [
      "Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", 
      "Kumi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"
    ]
  },
  {
    name: "Yobe",
    code: "YO",
    lgas: [
      "Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", 
      "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", 
      "Yusufari"
    ]
  },
  {
    name: "Zamfara",
    code: "ZA",
    lgas: [
      "Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", "Gusau", 
      "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Chafe", "Zurmi"
    ]
  },
  {
    name: "FCT (Abuja)",
    code: "FC",
    lgas: [
      "Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council"
    ]
  }
];

/**
 * Get LGAs for a specific state
 */
export function getLGAsForState(stateName: string): string[] {
  const state = NIGERIAN_STATES.find(s => s.name === stateName);
  return state?.lgas || [];
}

/**
 * Get all state names
 */
export function getAllStateNames(): string[] {
  return NIGERIAN_STATES.map(s => s.name);
}

