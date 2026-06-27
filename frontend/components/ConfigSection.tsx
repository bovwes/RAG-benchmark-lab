export default function ConfigSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between p-4">
      <div className="text-neutral-500">{title}</div>
      <div className="flex flex-col gap-2 items-end w-2/3">{children}</div>
    </div>
  );
}
