import React from 'react'

const Discription = ({ discription, Class}) => {
    return (
        <p
          className={`text-[15px] xl:text-base 2xl:text-lg font-normal ${Class}`}
          dangerouslySetInnerHTML={{ __html: discription }}
        />
    )
}

export default Discription
