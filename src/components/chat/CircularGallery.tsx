import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from 'react-dom';

import "./CircularGallery.css";

type GL = Renderer["gl"];

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: number;
  return function (this: any, ...args: Parameters<T>) {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t;
}

function autoBind(instance: any): void {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach((key) => {
    if (key !== "constructor" && typeof instance[key] === "function") {
      instance[key] = instance[key].bind(instance);
    }
  });
}

function getFontSize(font: string): number {
  const match = font.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 30;
}

function createTextTexture(
  gl: GL,
  text: string,
  font: string = "bold 30px monospace",
  color: string = "black"
): { texture: Texture; width: number; height: number } {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get 2d context");

  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const fontSize = getFontSize(font);
  const textHeight = Math.ceil(fontSize * 1.2);

  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;

  context.font = font;
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

interface TitleProps {
  gl: GL;
  plane: Mesh;
  renderer: Renderer;
  scene: Transform;
  text: string;
  textColor?: string;
  font?: string;
}

class Title {
  gl: GL;
  plane: Mesh;
  renderer: Renderer;
  scene: Transform;
  text: string;
  textColor: string;
  font: string;
  mesh!: Mesh;
  aspect: number = 1;

  constructor({ gl, plane, renderer, scene, text, textColor = "#545050", font = "30px sans-serif" }: TitleProps) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.scene = scene;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    // Create immediately to avoid undefined mesh during first frames
    this.createMesh();
    // Then try to load font and refresh texture to Montserrat once ready
    this.loadFontThenRefresh();
  }

  async loadFontThenRefresh() {
    try {
      if ((document as any).fonts?.load) {
        await (document as any).fonts.load(this.font, 'Aa');
        await (document as any).fonts.ready;
        this.refreshTexture();
      }
    } catch {}
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true,
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeightScaled = this.plane.scale.y * 0.15;
    const textWidthScaled = textHeightScaled * aspect;
    this.mesh.scale.set(textWidthScaled, textHeightScaled, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeightScaled * 0.5 - 0.05;
    // Do not parent to the scaled plane to avoid non-uniform scale distortion
    this.mesh.setParent(this.scene);
    this.aspect = aspect;
  }

  refreshTexture() {
    if (!this.mesh) return;
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    // Replace texture uniform
    const program = (this.mesh as any).program as Program;
    if (program && program.uniforms && program.uniforms.tMap) {
      program.uniforms.tMap.value = texture;
    }
    const aspect = width / height;
    this.aspect = aspect;
    const textHeightScaled = this.plane.scale.y * 0.15;
    const textWidthScaled = textHeightScaled * aspect;
    this.mesh.scale.set(textWidthScaled, textHeightScaled, 1);
  }
}

interface ScreenSize {
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
}

interface MediaProps {
  geometry: Plane;
  gl: GL;
  image: string;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: ScreenSize;
  text: string;
  viewport: Viewport;
  bend: number;
  textColor: string;
  borderRadius?: number;
  font?: string;
}

class Media {
  extra: number = 0;
  geometry: Plane;
  gl: GL;
  image: string;
  isVideo: boolean = false;
  video?: HTMLVideoElement;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: ScreenSize;
  text: string;
  viewport: Viewport;
  bend: number;
  textColor: string;
  borderRadius: number;
  font?: string;
  program!: Program;
  plane!: Mesh;
  title!: Title;
  titleOffsetY!: number;
  titleAspect!: number;
  scale!: number;
  padding!: number;
  width!: number;
  widthTotal!: number;
  x!: number;
  speed: number = 0;
  isBefore: boolean = false;
  isAfter: boolean = false;

  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    viewport,
    bend,
    textColor,
    borderRadius = 0,
    font,
  }: MediaProps) {
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.isVideo = /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(image);
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
    const textHeightScaled = this.plane.scale.y * 0.15;
    this.titleOffsetY = -this.plane.scale.y * 0.5 - textHeightScaled * 0.5 - 0.05;
  }

  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: false,
      minFilter: this.gl.LINEAR,
      magFilter: this.gl.LINEAR,
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE,
      flipY: true,
    });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          // Disable wavy effect
          p.z = 0.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          
          // Smooth antialiasing for edges
          float edgeSmooth = 0.002;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
      },
      transparent: true,
    });
    if (false) {
      // video preview disabled; always render image thumbnails
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        texture.image = img;
        (texture as any).needsUpdate = true;
        this.program.uniforms.uImageSizes.value = [img.naturalWidth || img.width, img.naturalHeight || img.height];
      };
      img.src = this.image;
    }
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    });
    this.plane.setParent(this.scene);
  }

  createTitle() {
    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      renderer: this.renderer,
      scene: this.scene,
      text: this.text,
      textColor: this.textColor,
      font: this.font,
    });
  }

  update(scroll: { current: number; last: number }, direction: "right" | "left") {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;
    // no video texture updates; thumbnails are images only

    // Keep the title aligned without inheriting plane's non-uniform scale
    if (this.title && (this.title as any).mesh && this.plane && this.plane.position) {
      const mesh = (this.title as any).mesh as Mesh;
      if (!this.titleAspect) {
        this.titleAspect = (this.title as any).aspect || (mesh.scale.y ? mesh.scale.x / mesh.scale.y : 1);
      }
      mesh.position.x = this.plane.position.x;
      mesh.position.y = this.plane.position.y + this.titleOffsetY;
      mesh.rotation.z = this.plane.rotation.z;
      const baseHeight = this.plane.scale.y * 0.15;
      mesh.scale.set(baseHeight * this.titleAspect, baseHeight, 1);
    }

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === "right" && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === "left" && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }

  onResize({ screen, viewport }: { screen?: ScreenSize; viewport?: Viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
      }
    }
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
    const textHeightScaled = this.plane.scale.y * 0.15;
    this.titleOffsetY = -this.plane.scale.y * 0.5 - textHeightScaled * 0.5 - 0.05;
  }
}

interface AppConfig {
  items?: { thumb?: string; src?: string; image?: string; href?: string; text: string; type?: 'image' | 'video'; poster?: string }[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  onItemClick?: (payload: { index: number; image: string; text: string }) => void;
}

class App {
  container: HTMLElement;
  scrollSpeed: number;
  scroll: {
    ease: number;
    current: number;
    target: number;
    last: number;
    position?: number;
  };
  onCheckDebounce: (...args: any[]) => void;
  renderer!: Renderer;
  gl!: GL;
  camera!: Camera;
  scene!: Transform;
  planeGeometry!: Plane;
  medias: Media[] = [];
  mediasImages: { thumb: string; href: string; text: string }[] = [];
  originalLength: number = 0;
  screen!: { width: number; height: number };
  viewport!: { width: number; height: number };
  raf: number = 0;
  onItemClick?: (payload: { index: number; image: string; text: string }) => void;

  boundOnResize!: () => void;
  boundOnWheel!: (e: Event) => void;
  boundOnTouchDown!: (e: MouseEvent | TouchEvent) => void;
  boundOnTouchMove!: (e: MouseEvent | TouchEvent) => void;
  boundOnTouchUp!: () => void;
  boundOnClick!: (e: MouseEvent) => void;

  isDown: boolean = false;
  start: number = 0;

  constructor(
    container: HTMLElement,
    {
      items,
      bend = 1,
      textColor = "#ffffff",
      borderRadius = 0,
      font = "bold 30px Figtree",
      scrollSpeed = 2,
      scrollEase = 0.05,
      onItemClick,
    }: AppConfig
  ) {
    document.documentElement.classList.remove("no-js");
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onItemClick = onItemClick;
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.centerInitial();
    this.update();
    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({ 
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.renderer.gl.canvas as HTMLCanvasElement);
  }

  centerInitial() {
    if (!this.medias || !this.medias.length) return;
    const width = this.medias[0].width || 0;
    const middleIndex = Math.floor(this.medias.length / 2);
    const target = width * middleIndex;
    this.scroll.current = target;
    this.scroll.target = target;
    this.scroll.last = target;
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100,
    });
  }

  createMedias(
    items: { src?: string; image?: string; text: string; type?: 'image' | 'video'; poster?: string }[] | undefined,
    bend: number = 1,
    textColor: string,
    borderRadius: number,
    font: string
  ) {
    const defaultItems = [
      { thumb: 'https://old.markrenzo.com/assets/images/gallery02/381ca72b.jpg', href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_An8AbHKOuJ9VuOY5cHV_Qb7ibnYPw5IjwMEFQVzAO961vc8LQx51AJAFvDqWAdaiq6l3Dk7zSbHdyt4dgKMI0o4.mp4', text: 'Forest City Malaysia' },
      { thumb: 'https://old.markrenzo.com/assets/images/gallery02/00ba297d.jpg', href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_An8EXcgMgp6yHFUfPvbVc3pZ-RVbgQFJQo0q7snBr8BXySAh8_zw4AtpdhPfq8l8FhZPqaTDJs8EttSKg7QD4x6R.mp4', text: 'Solo Travel' },
      { thumb: 'https://old.markrenzo.com/assets/images/gallery02/5ffec952.jpg', href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_An9_3U3c5ITMd4RbbrAG3E9Y_QeaAInxsVie3WvOybRjFV952SFh71EhYiHycP1XUGjP4dJRQ1ZsbU1UUX32zMjf.mp4', text: 'Gaming Hotel' },
      { thumb: 'https://old.markrenzo.com/assets/images/gallery02/f77fd802.jpg?v=3d3d6d67', href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_D0459294601A98F928D3907BEC3CA9AC_video_dashinit.mp4', text: 'Grampians' },
    ];
    const galleryItems = items && items.length ? items : defaultItems;
    this.originalLength = galleryItems.length;
    this.mediasImages = galleryItems.concat(galleryItems).map((g) => ({
      thumb: (g as any).thumb || (g as any).image || (g as any).src,
      href: (g as any).href || (g as any).src || (g as any).image,
      text: (g as any).text,
    }));
    this.medias = this.mediasImages.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: (data as any).thumb,
        index,
        length: this.mediasImages.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        text: (data as any).text,
        viewport: this.viewport,
        bend,
        textColor,
        borderRadius,
        font,
      });
    });
  }

  onTouchDown(e: MouseEvent | TouchEvent) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = "touches" in e ? e.touches[0].clientX : e.clientX;
  }

  onTouchMove(e: MouseEvent | TouchEvent) {
    if (!this.isDown) return;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = (this.scroll.position ?? 0) + distance;
  }

  onTouchUp() {
    this.isDown = false;
    this.onCheck();
  }

  onWheel(e: Event) {
    const wheelEvent = e as WheelEvent;
    const delta = wheelEvent.deltaY || (wheelEvent as any).wheelDelta || (wheelEvent as any).detail;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.onCheckDebounce();
  }

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height,
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) {
      this.medias.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? "right" : "left";
    if (this.medias) {
      this.medias.forEach((media) => media.update(this.scroll, direction));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    this.boundOnClick = this.onClick.bind(this);
    window.addEventListener("resize", this.boundOnResize);
    window.addEventListener("mousewheel", this.boundOnWheel);
    window.addEventListener("wheel", this.boundOnWheel);
    window.addEventListener("mousedown", this.boundOnTouchDown);
    window.addEventListener("mousemove", this.boundOnTouchMove);
    window.addEventListener("mouseup", this.boundOnTouchUp);
    window.addEventListener("touchstart", this.boundOnTouchDown);
    window.addEventListener("touchmove", this.boundOnTouchMove);
    window.addEventListener("touchend", this.boundOnTouchUp);
    this.renderer.gl.canvas.addEventListener("click", this.boundOnClick);
    this.container.addEventListener("click", this.boundOnClick);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.boundOnResize);
    window.removeEventListener("mousewheel", this.boundOnWheel);
    window.removeEventListener("wheel", this.boundOnWheel);
    window.removeEventListener("mousedown", this.boundOnTouchDown);
    window.removeEventListener("mousemove", this.boundOnTouchMove);
    window.removeEventListener("mouseup", this.boundOnTouchUp);
    window.removeEventListener("touchstart", this.boundOnTouchDown);
    window.removeEventListener("touchmove", this.boundOnTouchMove);
    window.removeEventListener("touchend", this.boundOnTouchUp);
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas) {
      this.renderer.gl.canvas.removeEventListener("click", this.boundOnClick);
    }
    if (this.container) {
      this.container.removeEventListener("click", this.boundOnClick);
    }
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas as HTMLCanvasElement);
    }
  }

  onClick(_e: MouseEvent) {
    if (!this.medias || this.medias.length === 0) return;
    // Pick the item whose plane is nearest to the viewport center (x = 0)
    let nearestIndex = 0;
    let nearestAbs = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.medias.length; i++) {
      const m = this.medias[i];
      const absx = Math.abs((m.plane as any).position?.x ?? Number.POSITIVE_INFINITY);
      if (absx < nearestAbs) {
        nearestAbs = absx;
        nearestIndex = i;
      }
    }
    const effectiveIndex = this.originalLength > 0 ? (nearestIndex % this.originalLength) : nearestIndex;
    const data = this.mediasImages[nearestIndex] || { href: '', text: '' } as any;
    const detail = { index: effectiveIndex, image: data.href, text: data.text };
    try {
      console.log('[CircularGallery] click', detail);
      const evt = new CustomEvent('open-lightbox', { detail });
      window.dispatchEvent(evt);
    } catch {}
    if (this.onItemClick) this.onItemClick(detail);
  }
}

interface CircularGalleryProps {
  items?: { thumb?: string; href?: string; src?: string; image?: string; text: string; type?: 'image' | 'video'; poster?: string }[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  onItemClick?: (payload: { index: number; image: string; text: string }) => void;
}

export default function CircularGallery({
  items,
  bend = 3,
  textColor = "#ffffff",
  borderRadius = 0.05,
  font = "bold 30px Figtree",
  scrollSpeed = 2,
  scrollEase = 0.05,
  onItemClick,
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');

  const isImageUrl = (url: string) => /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url);

  const openModal = (url: string, title?: string) => {
    setModalUrl(url);
    setModalTitle(title || '');
    setIsModalOpen(true);
    try { document.body.style.overflow = 'hidden'; } catch {}
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalUrl(null);
    setModalTitle('');
    try { document.body.style.overflow = ''; } catch {}
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    if (isModalOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen]);
  useEffect(() => {
    if (!containerRef.current) return;
    const app = new App(containerRef.current, {
      items,
      bend,
      textColor,
      borderRadius,
      font,
      scrollSpeed,
      scrollEase,
      onItemClick: ({ image, text }) => {
        if (onItemClick) {
          onItemClick({ index: 0, image, text });
          return;
        }
        if (image) openModal(image, text);
      },
    });
    return () => {
      app.destroy();
    };
  }, [items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase, onItemClick]);
  return (
    <>
      <div className="circular-gallery" ref={containerRef} />
      {isModalOpen && modalUrl && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
          }}
        >
          <div
            style={{
              position: 'relative', width: 'min(1200px, 95vw)', height: 'min(82vh, 85vh)',
              background: 'rgba(12,12,12,0.98)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)',
              overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}
          >
            <button
              onClick={closeModal}
              aria-label="Close"
              type="button"
              style={{
                position: 'absolute', top: '10px', right: '10px', padding: '6px 10px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', zIndex: 1
              }}
            >
              ✕
            </button>
            {isImageUrl(modalUrl) ? (
              <img src={modalUrl} alt={modalTitle} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#111' }} />
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <iframe
                  src={modalUrl}
                  title={modalTitle || 'Preview'}
                  style={{ width: '100%', height: '100%', border: 'none', background: '#111' }}
                  loading="eager"
                  allow="microphone; camera; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px',
                    background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.7) 100%)',
                    display: 'flex', gap: '10px', justifyContent: 'flex-end'
                  }}
                >
                  <a
                    href={modalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
                      background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none'
                    }}
                  >
                    Open in new tab
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}


