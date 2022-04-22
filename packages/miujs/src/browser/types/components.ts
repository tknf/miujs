type StaticImplements<I extends new (...args: any[]) => any, C extends I> = InstanceType<I>;

interface BrowserComponentBase {
  new (...args: any[]): HTMLElement;

  $name: string;
}

export class BrowserComponent
  extends HTMLElement
  implements StaticImplements<BrowserComponentBase, typeof BrowserComponent>
{
  static $name = "";
}
