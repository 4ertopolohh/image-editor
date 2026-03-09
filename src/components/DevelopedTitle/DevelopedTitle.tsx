import styles from './DevelopedTitle.module.scss'

interface DevelopedTitleProps {
  developedBy: string
  studioName: string
}

const DevelopedTitle = ({ developedBy, studioName }: DevelopedTitleProps) => {
  return (
    <h1 className={styles.developedTitle}>
      {developedBy}{' '}
      <a href="https://t.me/NemidaStudio" target="_blank" rel="noreferrer noopener">
        {studioName}
      </a>
    </h1>
  )
}

export default DevelopedTitle
