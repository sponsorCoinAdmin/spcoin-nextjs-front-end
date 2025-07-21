export default function BaseScrollPanel({
  id,
  children
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="flex flex-col h-full w-full rounded-[15px] overflow-hidden"
    >
      <div className="flex flex-col h-full w-full">
        {children}
      </div>
    </div>
  );
}
