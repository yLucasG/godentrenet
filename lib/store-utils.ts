// ─── Terminology ──────────────────────────────────────────────────────────────

export type StoreTerms = {
  catalog: string;   // section heading for product grid
  cart: string;      // name for the cart/order
  item: string;      // singular noun for a product
  items: string;     // plural noun for products
};

export function getStoreTerminology(type: string): StoreTerms {
  switch (type) {
    case "FOOD":
      return { catalog: "Cardápio",  cart: "Bandeja",      item: "Prato",    items: "pratos" };
    case "SERVICES":
      return { catalog: "Serviços",  cart: "Agendamento",  item: "Serviço",  items: "serviços" };
    case "GAS_WATER":
      return { catalog: "Catálogo",  cart: "Pedido",       item: "Produto",  items: "produtos" };
    case "RETAIL":
    case "GENERAL":
    default:
      return { catalog: "Catálogo",  cart: "Sacola",       item: "Produto",  items: "produtos" };
  }
}

// ─── Emojis ───────────────────────────────────────────────────────────────────

export function getStoreEmojis(type: string): string[] {
  switch (type) {
    case "FOOD":
      return [
        "🍔", "🍕", "🍣", "🌭", "🍰", "☕", "🥤", "🍜", "🥗", "🍱",
        "🧁", "🥩", "🥐", "🍳", "🫕", "🥟", "🍝", "🥘", "🧆", "🥙",
        "🍛", "🥞", "🧇", "🥓", "🍖", "🍗", "🌯", "🥫", "🫔", "🧃",
      ];
    case "RETAIL":
      return [
        "👕", "👗", "👖", "👟", "👜", "🧢", "🕶️", "💎", "👒", "🧣",
        "🧤", "👔", "💍", "🎒", "👠", "🩱", "🧥", "🩲", "💄", "🛍️",
        "👙", "🩳", "🧦", "🥿", "👡", "💅", "🪮", "🪭", "🎀", "🧲",
      ];
    case "GAS_WATER":
      return [
        "💧", "⛽", "🏍️", "🏠", "🧊", "🚚", "🪣", "🫙", "🔵", "💼",
        "🔧", "⚙️", "🔑", "📦", "🏪", "🌊", "🚰", "🏗️", "⚡", "🔋",
        "🛢️", "🔩", "🪛", "🚛", "🏭", "🧯", "📏", "🔦", "🗜️", "🪝",
      ];
    case "SERVICES":
      return [
        "✂️", "🐶", "💅", "🦷", "🧼", "💈", "🐾", "💊", "🧖", "🧴",
        "🪮", "🎨", "🔬", "🩺", "🏥", "🐱", "🧹", "🧽", "🪥", "💇",
        "🩻", "🧪", "🩹", "🪒", "💉", "🧬", "🎭", "🏋️", "🧘", "🛁",
      ];
    default:
      return [
        "🛍️", "📦", "🏷️", "✨", "⭐", "🎁", "💡", "🔑", "🎯", "🌟",
        "💫", "🎪", "🏪", "🛒", "📋", "🔖", "🎀", "🧧", "🏆", "🎖️",
        "🌈", "🎲", "🎮", "📱", "💻", "🖥️", "📷", "🔭", "🎵", "🎸",
      ];
  }
}
