import styles from './DevelopedTitle.module.scss'

interface DevelopedTitleProps {
  developedBy: string
  studioName: string
  studioHref: string
}

const DevelopedTitle = ({ developedBy, studioName, studioHref }: DevelopedTitleProps) => {
  return (
    <p className={styles.developedTitle}>
      {developedBy}{' '}
      <a href={studioHref} target="_blank" rel="noreferrer noopener">
        {studioName}
      </a>
    </p>
  )
}

export default DevelopedTitle
