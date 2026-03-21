const EMOJI_MAP: Array<{ emoji: string; keywords: string[] }> = [
  // Food & Drink
  { emoji: '🍕', keywords: ['pizza', 'italian', 'pepperoni'] },
  { emoji: '🍔', keywords: ['burger', 'hamburger', 'fast food', 'mcdonalds'] },
  { emoji: '🍣', keywords: ['sushi', 'japanese', 'fish', 'seafood'] },
  { emoji: '🍜', keywords: ['noodle', 'ramen', 'pasta', 'chinese'] },
  { emoji: '🌮', keywords: ['taco', 'mexican', 'burrito', 'nacho'] },
  { emoji: '🍺', keywords: ['beer', 'pub', 'bar', 'drinks', 'drinking', 'alcohol', 'brewery'] },
  { emoji: '🍷', keywords: ['wine', 'winery', 'vineyard', 'prosecco', 'champagne'] },
  { emoji: '☕', keywords: ['coffee', 'cafe', 'espresso', 'latte', 'cappuccino', 'tea'] },
  { emoji: '🍰', keywords: ['cake', 'birthday', 'party', 'dessert', 'sweet', 'bakery'] },
  { emoji: '🥗', keywords: ['salad', 'healthy', 'vegan', 'vegetarian', 'diet'] },
  { emoji: '🍱', keywords: ['lunch', 'box', 'bento', 'meal', 'food'] },
  { emoji: '🛒', keywords: ['grocery', 'groceries', 'supermarket', 'shopping', 'market', 'store'] },

  // Home & Living
  { emoji: '🏠', keywords: ['home', 'house', 'apartment', 'flat', 'rent', 'roommate', 'roommates', 'housemates', 'living', 'accommodation'] },
  { emoji: '🛋️', keywords: ['furniture', 'interior', 'decor', 'couch', 'sofa', 'lounge'] },
  { emoji: '🔑', keywords: ['key', 'keys', 'lock', 'access', 'airbnb'] },
  { emoji: '🧹', keywords: ['clean', 'cleaning', 'chores', 'housework', 'maintenance'] },
  { emoji: '💡', keywords: ['electricity', 'electric', 'power', 'utilities', 'bills', 'utility'] },
  { emoji: '💧', keywords: ['water', 'plumbing', 'hydro'] },
  { emoji: '📦', keywords: ['moving', 'move', 'boxes', 'packing', 'storage'] },

  // Travel & Transport
  { emoji: '✈️', keywords: ['flight', 'fly', 'air', 'airport', 'plane', 'travel', 'trip', 'holiday', 'vacation', 'abroad'] },
  { emoji: '🏖️', keywords: ['beach', 'sea', 'ocean', 'coast', 'summer', 'sun', 'ibiza', 'maldives'] },
  { emoji: '🏔️', keywords: ['mountain', 'hiking', 'trek', 'ski', 'skiing', 'alps', 'snow', 'winter'] },
  { emoji: '🚗', keywords: ['car', 'drive', 'road', 'fuel', 'petrol', 'gas', 'parking', 'carpool'] },
  { emoji: '🚌', keywords: ['bus', 'transport', 'public', 'transit', 'commute'] },
  { emoji: '🚢', keywords: ['cruise', 'ship', 'boat', 'sailing', 'sea trip'] },
  { emoji: '🏕️', keywords: ['camp', 'camping', 'tent', 'outdoor', 'nature', 'forest'] },
  { emoji: '🗺️', keywords: ['adventure', 'explore', 'expedition', 'backpack', 'backpacking'] },
  { emoji: '🌍', keywords: ['world', 'europe', 'international', 'global', 'abroad'] },
  { emoji: '🎒', keywords: ['backpack', 'school', 'student', 'university', 'college'] },
  { emoji: '🏨', keywords: ['hotel', 'hostel', 'accommodation', 'stay', 'bnb'] },

  // Events & Social
  { emoji: '🎉', keywords: ['party', 'celebration', 'celebrate', 'event', 'gathering', 'fest', 'festival'] },
  { emoji: '🎂', keywords: ['birthday', 'bday', 'anniversary', 'celebration'] },
  { emoji: '💍', keywords: ['wedding', 'marriage', 'bride', 'groom', 'engagement', 'honeymoon'] },
  { emoji: '🎓', keywords: ['graduation', 'graduate', 'uni', 'university', 'college', 'school', 'study', 'students'] },
  { emoji: '🎮', keywords: ['gaming', 'game', 'games', 'esports', 'playstation', 'xbox', 'nintendo'] },
  { emoji: '🎬', keywords: ['movie', 'cinema', 'film', 'netflix', 'series', 'show'] },
  { emoji: '🎵', keywords: ['music', 'concert', 'festival', 'band', 'gig', 'show', 'ticket'] },
  { emoji: '🏟️', keywords: ['sport', 'sports', 'match', 'game', 'stadium', 'football', 'soccer', 'basketball', 'baseball'] },
  { emoji: '🎭', keywords: ['theatre', 'theater', 'play', 'opera', 'show', 'performance', 'arts'] },
  { emoji: '🃏', keywords: ['poker', 'cards', 'casino', 'gambling', 'games night'] },

  // Sports & Fitness
  { emoji: '⚽', keywords: ['football', 'soccer', 'footie', 'pitch', 'team'] },
  { emoji: '🏀', keywords: ['basketball', 'nba', 'hoops'] },
  { emoji: '🎾', keywords: ['tennis', 'racket', 'court'] },
  { emoji: '🏋️', keywords: ['gym', 'fitness', 'workout', 'training', 'weights', 'bodybuilding'] },
  { emoji: '🧘', keywords: ['yoga', 'meditation', 'wellness', 'pilates', 'mindfulness'] },
  { emoji: '🚴', keywords: ['cycling', 'bike', 'bicycle', 'ride', 'velodrome'] },
  { emoji: '🏊', keywords: ['swimming', 'pool', 'swim', 'aquatic'] },
  { emoji: '🎿', keywords: ['ski', 'skiing', 'snowboard', 'winter sport', 'slope'] },
  { emoji: '🏄', keywords: ['surf', 'surfing', 'wave', 'board'] },
  { emoji: '🥊', keywords: ['boxing', 'fight', 'martial arts', 'mma', 'ufc'] },
  { emoji: '🎣', keywords: ['fishing', 'fish', 'angling', 'outdoors'] },

  // Work & Business
  { emoji: '💼', keywords: ['work', 'business', 'office', 'corporate', 'professional', 'company', 'team'] },
  { emoji: '💻', keywords: ['tech', 'technology', 'software', 'startup', 'coding', 'it', 'developer', 'digital'] },
  { emoji: '📊', keywords: ['finance', 'money', 'budget', 'accounting', 'investment', 'expenses'] },
  { emoji: '🏗️', keywords: ['construction', 'building', 'project', 'renovation', 'architect'] },
  { emoji: '🎨', keywords: ['art', 'design', 'creative', 'artist', 'studio', 'graphic'] },
  { emoji: '📚', keywords: ['book', 'reading', 'library', 'study', 'education', 'learn', 'knowledge'] },

  // Family & Friends
  { emoji: '👨‍👩‍👧‍👦', keywords: ['family', 'parents', 'kids', 'children', 'household'] },
  { emoji: '👫', keywords: ['couple', 'partner', 'relationship', 'date', 'dating'] },
  { emoji: '🐶', keywords: ['dog', 'puppy', 'pet', 'animal', 'vet'] },
  { emoji: '🐱', keywords: ['cat', 'kitten', 'pet', 'animal'] },
  { emoji: '🌱', keywords: ['garden', 'gardening', 'plant', 'nature', 'green', 'eco', 'environment'] },
]

/**
 * Returns up to `limit` emojis relevant to the given search string.
 * Matches are ranked: full-word match > partial match.
 */
export function searchEmoji(query: string, limit = 6): string[] {
  if (!query.trim()) return []

  const words = query.toLowerCase().trim().split(/\s+/)
  const scored: { emoji: string; score: number }[] = []

  for (const entry of EMOJI_MAP) {
    let score = 0
    for (const word of words) {
      for (const kw of entry.keywords) {
        if (kw === word) {
          score += 3 // exact keyword match
        } else if (kw.includes(word) || word.includes(kw)) {
          score += 1 // partial match
        }
      }
    }
    if (score > 0) scored.push({ emoji: entry.emoji, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map(e => e.emoji)
}

/** Returns the best single emoji for a name, or null if nothing matches. */
export function suggestEmoji(name: string): string | null {
  const results = searchEmoji(name, 1)
  return results[0] ?? null
}
