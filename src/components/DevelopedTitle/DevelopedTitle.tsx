import styles from './DevelopedTitle.module.scss'

interface DevelopedTitleProps {
  developedBy: string
  studioName: string
}

const DevelopedTitle = ({ developedBy, studioName }: DevelopedTitleProps) => {
  return (
    <p className={styles.developedTitle}>
      {developedBy}{' '}
      <a href="" target="_blank" rel="noreferrer noopener">
        {studioName}
      </a>
    </p>
  )
}

export default DevelopedTitle
