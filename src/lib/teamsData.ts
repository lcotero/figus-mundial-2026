export const WC_TEAMS = [
  // Hosts
  "Estados Unidos (Anfitrión)",
  "México (Anfitrión)",
  "Canadá (Anfitrión)",
  
  // CONMEBOL (América del Sur)
  "Argentina (Campeón)",
  "Brasil",
  "Uruguay",
  "Colombia",
  "Ecuador",
  "Chile",
  "Venezuela",
  "Paraguay",
  "Perú",

  // UEFA (Europa)
  "España",
  "Francia",
  "Inglaterra",
  "Alemania",
  "Italia",
  "Portugal",
  "Países Bajos",
  "Bélgica",
  "Croacia",
  "Suiza",
  "Dinamarca",
  "Polonia",
  "Ucrania",
  "Turquía",
  "Suecia",
  "Austria",

  // CAF (África)
  "Marruecos",
  "Senegal",
  "Nigeria",
  "Egipto",
  "Camerún",
  "Argelia",
  "Túnez",
  "Costa de Marfil",
  "Ghana",

  // AFC & OFC (Asia y Oceanía)
  "Japón",
  "Corea del Sur",
  "Australia",
  "Irán",
  "Arabia Saudita",
  "Catar",
  "Nueva Zelanda",

  // Special Sections
  "Estadios Oficiales",
  "Escudos de Oro",
  "Mascota y Leyendas"
];

export const TOTAL_STICKERS_PER_TEAM = 20;

// Helper to generate an empty album structure
export function createEmptyAlbumMap(): Record<string, number> {
  const stickers: Record<string, number> = {};
  for (const team of WC_TEAMS) {
    for (let i = 1; i <= TOTAL_STICKERS_PER_TEAM; i++) {
      stickers[`${team}_${i}`] = 0;
    }
  }
  return stickers;
}
