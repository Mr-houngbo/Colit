// African cities data with priorities
export const AFRICAN_CITIES = [
  // West Africa - Priority 1 (most populated)
  'Lagos, Nigeria', 'Abidjan, Côte d\'Ivoire', 'Accra, Ghana', 'Dakar, Sénégal',
  'Bamako, Mali', 'Ouagadougou, Burkina Faso', 'Conakry, Guinée', 'Lomé, Togo',
  'Cotonou, Bénin', 'Porto-Novo, Bénin', 'Niamey, Niger', 'Nouakchott, Mauritanie',

  // North Africa - Priority 2
  'Cairo, Egypt', 'Casablanca, Morocco', 'Algiers, Algeria', 'Tunis, Tunisia',
  'Rabat, Morocco', 'Tripoli, Libya', 'Khartoum, Sudan', 'Alexandria, Egypt',

  // East Africa - Priority 3
  'Nairobi, Kenya', 'Addis Ababa, Ethiopia', 'Dar es Salaam, Tanzania',
  'Kampala, Uganda', 'Mogadishu, Somalia', 'Djibouti, Djibouti',
  'Kigali, Rwanda', 'Bujumbura, Burundi',

  // Central Africa - Priority 4
  'Kinshasa, DRC', 'Lubumbashi, DRC', 'Brazzaville, Congo', 'Yaoundé, Cameroon',
  'Douala, Cameroon', 'Libreville, Gabon', 'Bangui, Central African Republic',

  // Southern Africa - Priority 5
  'Johannesburg, South Africa', 'Cape Town, South Africa', 'Durban, South Africa',
  'Pretoria, South Africa', 'Maputo, Mozambique', 'Harare, Zimbabwe',
  'Lusaka, Zambia', 'Windhoek, Namibia', 'Gaborone, Botswana',

  // Major coastal cities
  'Mombasa, Kenya', 'Tanger, Morocco', 'Oran, Algeria', 'Beirut, Lebanon',
  'Tel Aviv, Israel', 'Athens, Greece', 'Istanbul, Turkey', 'Marseille, France',
  'Barcelona, Spain', 'Lisbon, Portugal', 'London, UK', 'Paris, France',

  // Other major cities
  'Rome, Italy', 'Berlin, Germany', 'Amsterdam, Netherlands', 'Brussels, Belgium',
  'Geneva, Switzerland', 'Vienna, Austria', 'Prague, Czech Republic'
].sort();

export const getCitySuggestions = (input: string, maxResults: number = 5): string[] => {
  if (!input || input.length < 2) return [];

  const normalizedInput = input.toLowerCase().trim();

  // Exact matches first
  const exactMatches = AFRICAN_CITIES.filter(city =>
    city.toLowerCase().startsWith(normalizedInput)
  );

  // Partial matches
  const partialMatches = AFRICAN_CITIES.filter(city =>
    city.toLowerCase().includes(normalizedInput) &&
    !city.toLowerCase().startsWith(normalizedInput)
  );

  // Combine and limit results
  return [...exactMatches, ...partialMatches].slice(0, maxResults);
};
