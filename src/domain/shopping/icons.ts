import { SHOPPING_CATEGORIES, type CategoryId } from './categories';
import { productKey } from './normalize';

/**
 * Icono de cada producto. Antes se enseñaba el de su categoría, y el arroz salía con un
 * bote de conserva o el pollo con un filete. Aquí cada emoji lleva los productos (o las
 * palabras) a los que representa; lo que no aparece usa el icono de su categoría.
 *
 * Solo se usan emojis anteriores a Unicode 14, que Android muestra desde la versión 11.
 */
const ICON_RULES: readonly (readonly [icon: string, names: string])[] = [
  // Varias palabras: ganan a las palabras sueltas ("pasta de dientes" no es pasta).
  ['🦷', 'pasta de dientes, hilo dental, enjuague bucal'],
  ['🪥', 'cepillo de dientes'],
  ['🧻', 'papel higiénico, papel de cocina, servilletas, pañuelos'],
  ['🍟', 'patatas fritas'],
  ['🥥', 'leche de coco, coco'],
  ['🥫', 'tomate frito, tomate triturado, salsa, kétchup, mayonesa, mostaza, conservas'],
  ['🍫', 'crema de cacao, chocolate, bombones, cacao, barritas, turrón'],
  ['🥜', 'crema de cacahuete, frutos secos, nueces, almendras, avellanas, cacahuetes, pistachos'],
  ['🌻', 'aceite de girasol, pipas'],
  ['🍽️', 'sal de lavavajillas, lavavajillas, abrillantador'],
  ['🪒', 'espuma de afeitar, maquinillas, cuchillas'],
  ['🍕', 'masa de pizza, pizza'],
  ['🥐', 'masa de hojaldre, croissants'],
  ['🫓', 'tortillas de trigo, tortillas'],
  ['🍲', 'judías blancas, lentejas, garbanzos, alubias, legumbres, caldo, sopa, cocido'],
  ['🐈', 'snacks de gato, gato, arena, rascador, malta'],
  ['🐕', 'perro'],
  ['🐾', 'pienso'],

  // Fruta y verdura
  ['🍅', 'tomates'],
  ['🥬', 'lechuga, espinacas, acelgas, rúcula, canónigos, col, apio, judías'],
  ['🧅', 'cebollas, cebolletas, puerros'],
  ['🧄', 'ajos'],
  ['🥔', 'patatas'],
  ['🍠', 'boniatos'],
  ['🥕', 'zanahorias'],
  ['🫑', 'pimientos'],
  ['🥒', 'pepinos, calabacines, pepinillos'],
  ['🍆', 'berenjenas'],
  ['🎃', 'calabaza'],
  ['🥦', 'brócoli, coliflor, verdura'],
  ['🍄', 'champiñones, setas'],
  ['🌽', 'maíz'],
  ['🥑', 'aguacates'],
  ['🍋', 'limones, limas, limonada'],
  ['🍊', 'naranjas, mandarinas, pomelos'],
  ['🍎', 'manzanas, fruta'],
  ['🍐', 'peras'],
  ['🍌', 'plátanos'],
  ['🍇', 'uvas, pasas'],
  ['🍓', 'fresas, frambuesas'],
  ['🫐', 'arándanos'],
  ['🍑', 'melocotones, nectarinas, albaricoques, ciruelas'],
  ['🍒', 'cerezas'],
  ['🥝', 'kiwis'],
  ['🍍', 'piña'],
  ['🥭', 'mangos'],
  ['🍈', 'melón'],
  ['🍉', 'sandía'],
  ['🌿', 'perejil, cilantro, albahaca, hierbabuena, orégano, laurel'],
  ['🥗', 'ensalada'],

  // Carne y pescado
  ['🍗', 'pollo, pavo, muslos, pechugas, nuggets'],
  ['🥩', 'ternera, filetes, carne, cerdo, lomo, costillas, chuletas, cordero, conejo'],
  ['🍔', 'hamburguesas'],
  ['🌭', 'salchichas'],
  ['🥓', 'bacon, panceta'],
  ['🍖', 'jamón, chorizo, salchichón, fuet, mortadela, morcilla, embutido'],
  ['🐟', 'pescado, salmón, merluza, bacalao, atún, dorada, lubina, sardinas, boquerones, anchoas'],
  ['🦐', 'gambas, langostinos'],
  ['🦪', 'mejillones, almejas, berberechos'],
  ['🦑', 'calamares, sepia'],
  ['🐙', 'pulpo'],
  ['🦀', 'surimi'],

  // Lácteos y huevos
  ['🥛', 'leche, yogures, kéfir, batidos, nata'],
  ['🧀', 'queso, mozzarella, parmesano, requesón'],
  ['🧈', 'mantequilla, margarina'],
  ['🥚', 'huevos'],
  ['🍮', 'natillas, flanes, cuajada, gelatina'],

  // Panadería
  ['🍞', 'pan, biscotes, tostadas, picatostes'],
  ['🥖', 'baguette, barra, picos'],
  ['🧁', 'magdalenas, bollos'],
  ['🍰', 'bizcocho, tarta'],
  ['🥟', 'empanada, empanadillas'],

  // Despensa
  ['🍚', 'arroz'],
  ['🍝', 'pasta, espaguetis, macarrones, tallarines, lasaña'],
  ['🍜', 'fideos'],
  ['🌾', 'harina, maicena, sémola, cuscús, quinoa'],
  ['🧂', 'sal, pimienta'],
  ['🫒', 'aceite, aceitunas'],
  ['🌶️', 'pimentón, guindillas'],
  ['🍛', 'curry'],
  ['🥣', 'puré, cereales, avena, muesli'],
  ['🍯', 'miel, mermelada, sirope'],

  // Congelados
  ['🍨', 'helado'],
  ['🧊', 'hielo'],

  // Bebidas
  ['💧', 'agua'],
  ['🧃', 'zumo'],
  ['🥤', 'refrescos, cola, tónica, gaseosa, bebida, horchata'],
  ['🍺', 'cerveza'],
  ['🍷', 'vino'],
  ['🍾', 'cava, sidra'],
  ['🍸', 'vermut'],
  ['☕', 'café, descafeinado, cápsulas'],
  ['🍵', 'té, infusiones, manzanilla'],

  // Dulces y aperitivos
  ['🍪', 'galletas, polvorones'],
  ['🍬', 'caramelos, chicles, gominolas, chuches, regaliz'],
  ['🍿', 'palomitas'],
  ['🥨', 'snacks, aperitivos'],

  // Limpieza
  ['🧺', 'detergente, suavizante'],
  ['🪣', 'fregasuelos, fregona'],
  ['🧽', 'estropajos, bayetas, esponja'],
  ['🧹', 'escoba, recogedor'],
  ['🧤', 'guantes'],
  ['🗑️', 'basura'],
  ['🔋', 'pilas'],
  ['💡', 'bombillas'],
  ['🕯️', 'velas'],
  ['🔥', 'cerillas, mechero'],

  // Higiene
  ['🧴', 'gel, champú, acondicionador, crema, colonia, laca, gomina, desodorante, lejía'],
  ['🧼', 'jabón'],
  ['🩹', 'tiritas'],
  ['💊', 'paracetamol, ibuprofeno'],
  ['👶', 'pañales, toallitas'],
];

/** Clave de producto (o de palabra) → icono. Si algo se repite, vale la primera regla. */
const ICON_BY_KEY = new Map<string, string>();
for (const [icon, names] of ICON_RULES) {
  for (const name of names.split(',')) {
    const key = productKey(name);
    if (key && !ICON_BY_KEY.has(key)) ICON_BY_KEY.set(key, icon);
  }
}

export function categoryIcon(categoryId: CategoryId): string {
  return SHOPPING_CATEGORIES.find((category) => category.id === categoryId)?.icon ?? '🛒';
}

/**
 * Icono de un producto. Primero se busca el nombre entero y, quitando palabras del final,
 * sus comienzos ("patatas fritas congeladas" → "patatas fritas"). Si no, la primera palabra
 * que tenga icono, porque en español lo principal va delante ("zumo de naranja" es un zumo,
 * "leche de avena" es leche). Si nada coincide, el de la categoría.
 */
export function productIcon(name: string, categoryId: CategoryId): string {
  const words = productKey(name).split(' ').filter(Boolean);
  for (let length = words.length; length > 0; length--) {
    const icon = ICON_BY_KEY.get(words.slice(0, length).join(' '));
    if (icon) return icon;
  }
  for (const word of words) {
    const icon = ICON_BY_KEY.get(word);
    if (icon) return icon;
  }
  return categoryIcon(categoryId);
}
