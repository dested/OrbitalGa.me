export interface Asset {
  name: string;
  size: {width: number; height: number};
  base: {x: number; y: number};
  image: HTMLImageElement;
  images: HTMLImageElement[];
  animated: boolean;
}

export interface AssetItem {
  size: {width: number; height: number};
  base: {x: number; y: number};
  url: string;
  frameIndex?: number;
  realName: string;
}

export class AssetManager {
  static assetQueue: {[key: string]: AssetItem} = {};
  static assets: {[key: string]: Asset} = {};
  static completed: () => void;
  static $assetsLoaded = 0;
  static $assetsRequested = 0;

  static start() {
    for (const name in this.assetQueue) {
      if (this.assetQueue.hasOwnProperty(name)) {
        const img = new Image();
        img.onload = () => {
          this.imageLoaded(img, name);
        };
        img.src = this.assetQueue[name].url;
      }
    }
  }

  static addAsset(name: string, url: string, size: {width: number; height: number}, base: {x: number; y: number}) {
    this.assetQueue[name] = {base, size, url, realName: name};
    this.$assetsRequested++;
  }

  static addAssetFrame(
    name: string,
    frameIndex: number,
    url: string,
    size: {width: number; height: number},
    base: {x: number; y: number}
  ) {
    this.assetQueue[name + frameIndex] = {base, size, url, frameIndex, realName: name};
    this.$assetsRequested++;
  }

  static imageLoaded(img: HTMLImageElement, name: string) {
    const assetQueue = this.assetQueue[name];

    const asset: Asset = this.assets[assetQueue.realName] || {
      size: null,
      base: null,
      name,
      image: null,
      images: null,
      animated: assetQueue.frameIndex !== undefined,
    };

    asset.size = assetQueue.size || {width: img.width, height: img.height};
    asset.base = assetQueue.base || {
      x: asset.size.width / 2,
      y: asset.size.height / 2,
    };

    if (assetQueue.frameIndex !== undefined) {
      asset.images = asset.images || [];
      asset.images[assetQueue.frameIndex] = img;
    } else {
      asset.image = img;
    }

    this.assets[assetQueue.realName] = asset;

    this.$assetsLoaded++;
    if (this.$assetsLoaded === this.$assetsRequested) {
      setTimeout(() => {
        this.completed && this.completed();
      }, 100);
    }
  }
}
