import React from 'react'
export const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={34}
    height={34}
    viewBox="0 0 34 34"
    fill="none"
  >
    <path
      d="M10.1066 16.9706C10.1066 16.5564 10.4424 16.2206 10.8566 16.2206L22.8774 16.2206C23.2917 16.2206 23.6274 16.5564 23.6274 16.9706C23.6274 17.3848 23.2916 17.7206 22.8774 17.7206L10.8566 17.7206C10.4424 17.7206 10.1066 17.3849 10.1066 16.9706Z"
      fill="#FFEBEB"
    />
    <path
      d="M15.9831 10.0763C16.276 9.78338 16.7509 9.78336 17.0438 10.0763L23.4078 16.4403C23.7007 16.7331 23.7007 17.208 23.4078 17.5009L17.0438 23.8649C16.7509 24.1578 16.276 24.1578 15.9831 23.8649C15.6902 23.5719 15.6902 23.0971 15.9831 22.8042L21.8168 16.9706L15.9831 11.1369C15.6902 10.844 15.6902 10.3692 15.9831 10.0763Z"
      fill="#FFEBEB"
    />
  </svg>
);
const Button = ({
  button_name,
  button_secondary,
  xxl,
  arrowicon,
  onClick,
  type = "button",
}) => {
  return (
    <>
      {
        button_secondary ?
          <div className='gradient-primary p-[3px] rounded-xl w-fit group relative overflow-hidden'>
            <span className='absolute top-0 left-[-120%] w-[40%] h-full bg-white/20 skew-x-[25deg] group-hover:left-[140%] transition-all duration-700 z-10'></span>

            <button
              type={type}
              onClick={onClick}
              className={`relative h-fit bg-black flex overflow-hidden items-center gap-2 text-white ${xxl ? 'px-4 lg:px-6 py-1 lg:py-[5px]' : 'px-4 py-[5px]'} rounded-xl cursor-pointer transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(255,0,0,0.25)] active:scale-95`}
            >
              <span className='transition-all duration-300 group-hover:tracking-wide'>
                {button_name}
              </span>

              {arrowicon && (
                <span className='transition-all duration-300 group-hover:translate-x-1'>
                  <ArrowIcon />
                </span>
              )}
            </button>
          </div>
          :
          <button
            type={type}
            onClick={onClick}
            className={`
            h-fit gradient-primary text-white
            ${xxl ? 'px-6 lg:px-8 py-2.5 lg:py-3' : 'px-4 py-2'}
            rounded-xl cursor-pointer
            transition-all duration-300 ease-in-out
            hover:scale-105 hover:shadow-xl
            active:scale-95
            relative overflow-hidden
            before:absolute before:top-0 before:left-[-100%]
            before:w-full before:h-full
            before:bg-white/20
            before:skew-x-12
            hover:before:left-[120%]
            before:transition-all before:duration-700
          `}
          >
            <span className="relative z-10">
              {button_name}
            </span>
          </button>
      }

    </>
  )
}

export default Button
