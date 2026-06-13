declare module "bwip-js" {
  interface BwipOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    paddingwidth?: number;
    paddingheight?: number;
    backgroundcolor?: string;
  }

  function toBuffer(options: BwipOptions): Promise<Buffer>;

  export default { toBuffer };
}
