'use client';

type ActionButtonProps = {
  id?: string;
  text: string;
  bgClass: 'bg-[#243056]' | 'bg-[#501505]' | 'bg-[#1f3e1d]';
  onClick?: () => void;
};

export default function ActionButton({ id, text, bgClass, onClick }: ActionButtonProps) {
  return (
    <div className="p-0 m-0">
      <button
        id={id}
        type="button"
        onClick={onClick}
        className={[
          'flex items-center justify-center',
          'text-[#5981F3]',
          bgClass,
          'w-full h-[55px]',
          'text-[20px] font-bold',
          'rounded-[12px]',
          'transition-[color,background-color] duration-300',
          'hover:cursor-pointer hover:text-green-500',
        ].join(' ')}
      >
        {text}
      </button>
    </div>
  );
}
