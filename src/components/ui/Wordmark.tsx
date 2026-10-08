// Typographic wordmark: "MEX" in Manrope 800, primary blue, tight tracking. No logo artwork.
export default function Wordmark({
  size = 'lg',
  as: Tag = 'span',
  className = '',
}: {
  size?: 'lg' | 'md'
  as?: 'span' | 'div' | 'h1'
  className?: string
}) {
  const sizeClass = size === 'lg' ? 'text-wordmark' : 'text-display'
  return (
    <Tag className={['font-sans text-primary', sizeClass, className].filter(Boolean).join(' ')} translate="no">
      MEX
    </Tag>
  )
}
