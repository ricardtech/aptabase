type Props = {
  children: React.ReactNode;
};

export function KeyMetricsContainer(props: Props) {
  return (
    <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full">
      {props.children}
    </div>
  );
}
