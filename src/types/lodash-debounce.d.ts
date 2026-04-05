declare module "lodash/debounce" {
  type Procedure<TArgs extends unknown[]> = (...args: TArgs) => void;

  interface DebouncedFunction<TArgs extends unknown[]> {
    (...args: TArgs): void;
    cancel(): void;
    flush(): void;
  }

  export default function debounce<TArgs extends unknown[]>(
    func: Procedure<TArgs>,
    wait?: number
  ): DebouncedFunction<TArgs>;
}
