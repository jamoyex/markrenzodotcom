export type LifeMedia = {
  type: "photo" | "video";
  src: string;
  poster?: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

// A video can use the same collage card with its poster as the thumbnail.
export const lifeMedia: readonly LifeMedia[] = [
  {
    type: "photo",
    src: "/images/great-ocean-road.png",
    alt: "Mark looking out over the Great Ocean Road coastline",
    caption: "the scenic route ↗",
    width: 706,
    height: 1264,
  },
  {
    type: "photo",
    src: "/images/life/canyon.jpg",
    alt: "Mark standing among curved red canyon walls",
    caption: "worth the detour.",
    width: 480,
    height: 640,
  },
  {
    type: "photo",
    src: "/images/startup-sips.png",
    alt: "Mark with friends at Startup Sips",
    caption: "good people. good ideas.",
    width: 710,
    height: 1270,
  },
  {
    type: "photo",
    src: "/images/life/mountains.jpg",
    alt: "Mark sitting in the snow with mountains behind him",
    caption: "a change of scenery.",
    width: 480,
    height: 640,
  },
  {
    type: "photo",
    src: "/images/life/gathering.jpg",
    alt: "A group gathering shared by Mark",
    caption: "better together.",
    width: 480,
    height: 640,
  },
];
