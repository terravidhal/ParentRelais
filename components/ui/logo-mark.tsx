/**
 * Marque ParentRelais — deux silhouettes, l'adulte et l'enfant.
 *
 * Extraite de la landing pour être réutilisée partout où le nom apparaissait
 * en texte seul : en-têtes des deux espaces et écrans de connexion. Un nom
 * sans signe visuel ne se reconnaît pas d'un coup d'œil.
 *
 * `currentColor` : la marque prend la couleur de son contexte, sans variante
 * à maintenir.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <g fill="currentColor">
        <circle cx="176" cy="164" r="48" />
        <path d="M176 224c-58 0-96 46-96 112v22h140v-60c0-34 10-58 28-74-24-1-48 0-72 0z" />
        <circle cx="322" cy="232" r="34" />
        <path d="M322 276c-42 0-70 34-70 82v18h108v-52c0-24 6-40 16-52-18-1-38 4-54 4z" />
      </g>
    </svg>
  );
}
