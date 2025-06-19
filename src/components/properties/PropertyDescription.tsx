import { useMemo } from 'react'

interface Props {
  selectedItems: Data[]
}

const PropertyDescription: React.FC<Props> = ({ selectedItems }) => {
  const description = useMemo(() => {
    const singleItem = selectedItems?.[0]
    if (selectedItems.length === 0) return 'No Description'
    else if (selectedItems.length === 1) return singleItem?.type
    else return 'Complex'
  }, [selectedItems])

  return <>{description}</>
}

export default PropertyDescription
