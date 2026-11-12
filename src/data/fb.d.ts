// TypeScript no conoce las extensiones de plataforma de Metro (`.native` / `.web`),
// así que `@/data/fb` se tipa contra la versión nativa, que es el producto.
export * from './fb.native';
