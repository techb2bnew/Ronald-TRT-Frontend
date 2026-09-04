import React from 'react'

const Title = ({ title, ish1, Class }) => {
    return (
        <>
            {
                ish1 ?
                    <h1
                     className={`text-[25px] md:text-[28px] lg:text-[32px] xl:text-[44px] 2xl:text-[54px] leading-10 lg:leading-11 xl:leading-[56px] 2xl:leading-[65px] font-semibold ${Class}`}
                        dangerouslySetInnerHTML={{ __html: title }}
                    />
                    :
                    <h2
                     className={`text-[25px] md:text-[28px] lg:text-[32px] xl:text-[44px] 2xl:text-[54px] leading-10 lg:leading-11 xl:leading-[56px] 2xl:leading-[65px] font-semibold ${Class}`}
                        dangerouslySetInnerHTML={{ __html: title }}
                    />
            }
        </>
    )
}

export default Title
