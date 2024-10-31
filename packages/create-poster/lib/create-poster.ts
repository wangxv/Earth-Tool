import html2canvas from 'html2canvas';


interface Options {
  data?: any; // 传入vue组件中的参数
  isDomExist: boolean; // 海报的html是否在页面内
  name: string; // 图片名称
}

let flag = 1; // 标识

class CreatePoster {
  private el: HTMLElement;
  private canvas: HTMLCanvasElement | null;
  private name: string;

  constructor(el: HTMLElement, name: string) {
    this.el = el;
    this.name = name;
    this.canvas = null;
  }

  /**
   * 使用html2canvas将dom转为canvas
   * @returns html2canvas转换后的canvas
   */
  public getCanvas() {
    window.scrollTo(0, 0); // 防止截图不完整
    return html2canvas(this.el, {
      useCORS: true,
      scrollY: 0,
      scale: 2
    }).then((res: any) => {
      this.canvas = res;
    });
  }

  // canvas转为DataURL
  public getDataURL() {
    if (this.canvas) {
      return this.canvas.toDataURL('image/png')
    }
  }

  /**
   * 将data url转为blob
   * @param dataURL data url
   * @returns blob对象
   */
  dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bStr = atob(arr[1]);
    let n = bStr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bStr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  /**
   * base64转blob文件
   */
  public getBlob() {
    const base64img = this.getDataURL();
    let file: any = null;
    if (base64img) {
      file = this.dataURLtoBlob(base64img);
      file.name = this.name;
    }
    return file;
  }

  /**
   * 判断图片是否全部加载完成
   * @returns 
   */
  async loadImg() {
    return new Promise((resolve, reject) => {
      if (this.el) {
        const imgList = this.el.getElementsByTagName('img');
        const { length } = imgList;
        let loadCount = 0;

        for (let i = 0; i < length; i++) {
          const img = imgList[i];
          const src = img.getAttribute('src') || '';

          const newImg = new Image();
          newImg.crossOrigin = 'anonymous';

          newImg.onload = async () => {
            loadCount++;
            if (loadCount === length) {
              return resolve(true);
            }
          };
          newImg.setAttribute('src', src);
        }
      } else {
        reject(new Error('没有内容'))
      }
    })
  }


  /**
   * 1、创建dom，保证海报内容在body里面
   * 2、校验海报dom里面的图片已经全部加载成功 （避免有空白）
   * @param options 参数
   * @param component vue组件
   * @param Vue vue
   * @returns 
   */
  public async start(options: Options, component, Vue) {
    return new Promise(async (resolve) => {
      const { isDomExist, data } = options;
      let el: any = null;
      if (!isDomExist && component && Vue) {
        // 创建组件构造器
        const CreatePosterConstructor = Vue.extend(component);
        // 创建实例
        const instance = new CreatePosterConstructor({
          data
        });
        instance.id = 'poster_' + flag++;
        // 创建dom
        instance.$mount();
        el = instance.$el;
        document.body.appendChild(el);
      } else {
        el = component;
      }
      this.el = el;

      if (!isDomExist) {
        const _flag = await this.loadImg();

        if (_flag) {
          resolve(true);
        }
      } else {
        resolve(true);
      }
    })
  }

 // 网络图片转为base64
  public async imgToBase64(url) {
    return new Promise((resolve, reject) => {
      try {
        const canvasEl = document.createElement('canvas');
        const img = new Image();
        const maxWidth = 1773;
        const maxPixel = 3145728;

        img.onload = () => {
          const { width, height } = img;
          const ratio = width / height;
          img.crossOrigin = 'anonymous';
          if (width * height > maxPixel) {
            canvasEl.width = Math.min(maxWidth, width);
            canvasEl.height = canvasEl.width / ratio;
          } else {
            canvasEl.width = width;
            canvasEl.height = height;
          }

          const ctx = canvasEl.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataURL = canvasEl.toDataURL('image/png');

          resolve(dataURL);
        }

        // 跨域
        img.crossOrigin = 'anonymous';
        img.src = url;

      } catch (err) {
        reject(err);
      }
    });
  }

  async getUrl(options) {
    const { name, isDomExist } = options;

    if (this.el) {
      await this.getCanvas();
      if (!isDomExist) {
        this.remove();
      }

      const blob = await this.getBlob();
      if (blob) {
        // TODO: 调用接口上传，返回返回值
      }
    }
  }

  remove() {
    if (this.el) {
      document.body.removeChild(this.el);
    }
  }
}

export default CreatePoster;