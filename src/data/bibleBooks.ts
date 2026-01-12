// Fallback data for Bible books when API is unavailable
// Uses abbreviations compatible with ABíbliaDigital API

export interface BibleBookFallback {
  name: string;
  abbrev: {
    pt: string;
    en: string;
  };
  testament: 'VT' | 'NT'; // VT = Velho Testamento, NT = Novo Testamento
  chapters: number;
  group: string;
  author: string;
}

export const BIBLE_BOOKS_FALLBACK: BibleBookFallback[] = [
  // ===== ANTIGO TESTAMENTO (39 livros) =====
  
  // Pentateuco
  { name: "Gênesis", abbrev: { pt: "gn", en: "gn" }, testament: "VT", chapters: 50, group: "Pentateuco", author: "Moisés" },
  { name: "Êxodo", abbrev: { pt: "ex", en: "ex" }, testament: "VT", chapters: 40, group: "Pentateuco", author: "Moisés" },
  { name: "Levítico", abbrev: { pt: "lv", en: "lv" }, testament: "VT", chapters: 27, group: "Pentateuco", author: "Moisés" },
  { name: "Números", abbrev: { pt: "nm", en: "nm" }, testament: "VT", chapters: 36, group: "Pentateuco", author: "Moisés" },
  { name: "Deuteronômio", abbrev: { pt: "dt", en: "dt" }, testament: "VT", chapters: 34, group: "Pentateuco", author: "Moisés" },
  
  // Históricos
  { name: "Josué", abbrev: { pt: "js", en: "js" }, testament: "VT", chapters: 24, group: "Históricos", author: "Josué" },
  { name: "Juízes", abbrev: { pt: "jz", en: "jz" }, testament: "VT", chapters: 21, group: "Históricos", author: "Samuel" },
  { name: "Rute", abbrev: { pt: "rt", en: "rt" }, testament: "VT", chapters: 4, group: "Históricos", author: "Samuel" },
  { name: "1 Samuel", abbrev: { pt: "1sm", en: "1sm" }, testament: "VT", chapters: 31, group: "Históricos", author: "Samuel" },
  { name: "2 Samuel", abbrev: { pt: "2sm", en: "2sm" }, testament: "VT", chapters: 24, group: "Históricos", author: "Samuel" },
  { name: "1 Reis", abbrev: { pt: "1rs", en: "1rs" }, testament: "VT", chapters: 22, group: "Históricos", author: "Jeremias" },
  { name: "2 Reis", abbrev: { pt: "2rs", en: "2rs" }, testament: "VT", chapters: 25, group: "Históricos", author: "Jeremias" },
  { name: "1 Crônicas", abbrev: { pt: "1cr", en: "1cr" }, testament: "VT", chapters: 29, group: "Históricos", author: "Esdras" },
  { name: "2 Crônicas", abbrev: { pt: "2cr", en: "2cr" }, testament: "VT", chapters: 36, group: "Históricos", author: "Esdras" },
  { name: "Esdras", abbrev: { pt: "ed", en: "ed" }, testament: "VT", chapters: 10, group: "Históricos", author: "Esdras" },
  { name: "Neemias", abbrev: { pt: "ne", en: "ne" }, testament: "VT", chapters: 13, group: "Históricos", author: "Neemias" },
  { name: "Ester", abbrev: { pt: "et", en: "et" }, testament: "VT", chapters: 10, group: "Históricos", author: "Desconhecido" },
  
  // Poéticos
  { name: "Jó", abbrev: { pt: "jó", en: "job" }, testament: "VT", chapters: 42, group: "Poéticos", author: "Desconhecido" },
  { name: "Salmos", abbrev: { pt: "sl", en: "sl" }, testament: "VT", chapters: 150, group: "Poéticos", author: "Davi e outros" },
  { name: "Provérbios", abbrev: { pt: "pv", en: "pv" }, testament: "VT", chapters: 31, group: "Poéticos", author: "Salomão" },
  { name: "Eclesiastes", abbrev: { pt: "ec", en: "ec" }, testament: "VT", chapters: 12, group: "Poéticos", author: "Salomão" },
  { name: "Cânticos", abbrev: { pt: "ct", en: "ct" }, testament: "VT", chapters: 8, group: "Poéticos", author: "Salomão" },
  
  // Profetas Maiores
  { name: "Isaías", abbrev: { pt: "is", en: "is" }, testament: "VT", chapters: 66, group: "Profetas Maiores", author: "Isaías" },
  { name: "Jeremias", abbrev: { pt: "jr", en: "jr" }, testament: "VT", chapters: 52, group: "Profetas Maiores", author: "Jeremias" },
  { name: "Lamentações", abbrev: { pt: "lm", en: "lm" }, testament: "VT", chapters: 5, group: "Profetas Maiores", author: "Jeremias" },
  { name: "Ezequiel", abbrev: { pt: "ez", en: "ez" }, testament: "VT", chapters: 48, group: "Profetas Maiores", author: "Ezequiel" },
  { name: "Daniel", abbrev: { pt: "dn", en: "dn" }, testament: "VT", chapters: 12, group: "Profetas Maiores", author: "Daniel" },
  
  // Profetas Menores
  { name: "Oséias", abbrev: { pt: "os", en: "os" }, testament: "VT", chapters: 14, group: "Profetas Menores", author: "Oséias" },
  { name: "Joel", abbrev: { pt: "jl", en: "jl" }, testament: "VT", chapters: 3, group: "Profetas Menores", author: "Joel" },
  { name: "Amós", abbrev: { pt: "am", en: "am" }, testament: "VT", chapters: 9, group: "Profetas Menores", author: "Amós" },
  { name: "Obadias", abbrev: { pt: "ob", en: "ob" }, testament: "VT", chapters: 1, group: "Profetas Menores", author: "Obadias" },
  { name: "Jonas", abbrev: { pt: "jn", en: "jn" }, testament: "VT", chapters: 4, group: "Profetas Menores", author: "Jonas" },
  { name: "Miquéias", abbrev: { pt: "mq", en: "mq" }, testament: "VT", chapters: 7, group: "Profetas Menores", author: "Miquéias" },
  { name: "Naum", abbrev: { pt: "na", en: "na" }, testament: "VT", chapters: 3, group: "Profetas Menores", author: "Naum" },
  { name: "Habacuque", abbrev: { pt: "hc", en: "hc" }, testament: "VT", chapters: 3, group: "Profetas Menores", author: "Habacuque" },
  { name: "Sofonias", abbrev: { pt: "sf", en: "sf" }, testament: "VT", chapters: 3, group: "Profetas Menores", author: "Sofonias" },
  { name: "Ageu", abbrev: { pt: "ag", en: "ag" }, testament: "VT", chapters: 2, group: "Profetas Menores", author: "Ageu" },
  { name: "Zacarias", abbrev: { pt: "zc", en: "zc" }, testament: "VT", chapters: 14, group: "Profetas Menores", author: "Zacarias" },
  { name: "Malaquias", abbrev: { pt: "ml", en: "ml" }, testament: "VT", chapters: 4, group: "Profetas Menores", author: "Malaquias" },
  
  // ===== NOVO TESTAMENTO (27 livros) =====
  
  // Evangelhos
  { name: "Mateus", abbrev: { pt: "mt", en: "mt" }, testament: "NT", chapters: 28, group: "Evangelhos", author: "Mateus" },
  { name: "Marcos", abbrev: { pt: "mc", en: "mc" }, testament: "NT", chapters: 16, group: "Evangelhos", author: "Marcos" },
  { name: "Lucas", abbrev: { pt: "lc", en: "lc" }, testament: "NT", chapters: 24, group: "Evangelhos", author: "Lucas" },
  { name: "João", abbrev: { pt: "jo", en: "jo" }, testament: "NT", chapters: 21, group: "Evangelhos", author: "João" },
  
  // Histórico
  { name: "Atos", abbrev: { pt: "at", en: "at" }, testament: "NT", chapters: 28, group: "Histórico", author: "Lucas" },
  
  // Cartas Paulinas
  { name: "Romanos", abbrev: { pt: "rm", en: "rm" }, testament: "NT", chapters: 16, group: "Cartas Paulinas", author: "Paulo" },
  { name: "1 Coríntios", abbrev: { pt: "1co", en: "1co" }, testament: "NT", chapters: 16, group: "Cartas Paulinas", author: "Paulo" },
  { name: "2 Coríntios", abbrev: { pt: "2co", en: "2co" }, testament: "NT", chapters: 13, group: "Cartas Paulinas", author: "Paulo" },
  { name: "Gálatas", abbrev: { pt: "gl", en: "gl" }, testament: "NT", chapters: 6, group: "Cartas Paulinas", author: "Paulo" },
  { name: "Efésios", abbrev: { pt: "ef", en: "ef" }, testament: "NT", chapters: 6, group: "Cartas Paulinas", author: "Paulo" },
  { name: "Filipenses", abbrev: { pt: "fp", en: "fp" }, testament: "NT", chapters: 4, group: "Cartas Paulinas", author: "Paulo" },
  { name: "Colossenses", abbrev: { pt: "cl", en: "cl" }, testament: "NT", chapters: 4, group: "Cartas Paulinas", author: "Paulo" },
  { name: "1 Tessalonicenses", abbrev: { pt: "1ts", en: "1ts" }, testament: "NT", chapters: 5, group: "Cartas Paulinas", author: "Paulo" },
  { name: "2 Tessalonicenses", abbrev: { pt: "2ts", en: "2ts" }, testament: "NT", chapters: 3, group: "Cartas Paulinas", author: "Paulo" },
  { name: "1 Timóteo", abbrev: { pt: "1tm", en: "1tm" }, testament: "NT", chapters: 6, group: "Cartas Paulinas", author: "Paulo" },
  { name: "2 Timóteo", abbrev: { pt: "2tm", en: "2tm" }, testament: "NT", chapters: 4, group: "Cartas Paulinas", author: "Paulo" },
  { name: "Tito", abbrev: { pt: "tt", en: "tt" }, testament: "NT", chapters: 3, group: "Cartas Paulinas", author: "Paulo" },
  { name: "Filemom", abbrev: { pt: "fm", en: "fm" }, testament: "NT", chapters: 1, group: "Cartas Paulinas", author: "Paulo" },
  
  // Carta aos Hebreus
  { name: "Hebreus", abbrev: { pt: "hb", en: "hb" }, testament: "NT", chapters: 13, group: "Cartas Gerais", author: "Desconhecido" },
  
  // Cartas Gerais
  { name: "Tiago", abbrev: { pt: "tg", en: "tg" }, testament: "NT", chapters: 5, group: "Cartas Gerais", author: "Tiago" },
  { name: "1 Pedro", abbrev: { pt: "1pe", en: "1pe" }, testament: "NT", chapters: 5, group: "Cartas Gerais", author: "Pedro" },
  { name: "2 Pedro", abbrev: { pt: "2pe", en: "2pe" }, testament: "NT", chapters: 3, group: "Cartas Gerais", author: "Pedro" },
  { name: "1 João", abbrev: { pt: "1jo", en: "1jo" }, testament: "NT", chapters: 5, group: "Cartas Gerais", author: "João" },
  { name: "2 João", abbrev: { pt: "2jo", en: "2jo" }, testament: "NT", chapters: 1, group: "Cartas Gerais", author: "João" },
  { name: "3 João", abbrev: { pt: "3jo", en: "3jo" }, testament: "NT", chapters: 1, group: "Cartas Gerais", author: "João" },
  { name: "Judas", abbrev: { pt: "jd", en: "jd" }, testament: "NT", chapters: 1, group: "Cartas Gerais", author: "Judas" },
  
  // Profecia
  { name: "Apocalipse", abbrev: { pt: "ap", en: "ap" }, testament: "NT", chapters: 22, group: "Profecia", author: "João" },
];
