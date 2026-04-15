import type { MovieDetail, MovieSummary, PagedResult } from "@/features/movies/types";

const FALLBACK_MOVIE_DETAILS: MovieDetail[] = [
  {
    id: 157336,
    title: "星际穿越",
    posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdropPath: "/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
    releaseDate: "2014-11-05",
    voteAverage: 8.4,
    overview: "一组宇航员穿越虫洞，寻找人类未来可居住的新家园。",
    genres: ["科幻", "冒险", "剧情"],
    runtime: 169,
    tagline: "爱，是唯一可以超越时间与空间的存在。",
    director: "克里斯托弗·诺兰",
    cast: [
      { id: 10297, name: "马修·麦康纳", character: "库珀", job: null, profilePath: null },
      { id: 1813, name: "安妮·海瑟薇", character: "布兰德", job: null, profilePath: null },
      { id: 3895, name: "杰西卡·查斯坦", character: "墨菲", job: null, profilePath: null },
      { id: 8293, name: "迈克尔·凯恩", character: "布兰德教授", job: null, profilePath: null },
    ],
    trailers: [],
    reviews: [],
  },
  {
    id: 27205,
    title: "盗梦空间",
    posterPath: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdropPath: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    releaseDate: "2010-07-15",
    voteAverage: 8.4,
    overview: "擅长潜入梦境的盗贼接受了一个几乎不可能完成的植入想法任务。",
    genres: ["科幻", "动作", "悬疑"],
    runtime: 148,
    tagline: "你的意识，才是犯罪现场。",
    director: "克里斯托弗·诺兰",
    cast: [
      { id: 6193, name: "莱昂纳多·迪卡普里奥", character: "柯布", job: null, profilePath: null },
      { id: 24045, name: "约瑟夫·高登-莱维特", character: "亚瑟", job: null, profilePath: null },
      { id: 27578, name: "艾略特·佩吉", character: "阿丽雅德妮", job: null, profilePath: null },
      { id: 2524, name: "汤姆·哈迪", character: "伊姆斯", job: null, profilePath: null },
    ],
    trailers: [],
    reviews: [],
  },
  {
    id: 155,
    title: "黑暗骑士",
    posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdropPath: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
    releaseDate: "2008-07-16",
    voteAverage: 8.5,
    overview: "蝙蝠侠在哥谭迎来最危险的对手，小丑掀起全面混乱。",
    genres: ["动作", "犯罪", "剧情"],
    runtime: 152,
    tagline: "为什么这么严肃？",
    director: "克里斯托弗·诺兰",
    cast: [
      { id: 3894, name: "克里斯蒂安·贝尔", character: "布鲁斯·韦恩", job: null, profilePath: null },
      { id: 1810, name: "希斯·莱杰", character: "小丑", job: null, profilePath: null },
      { id: 192, name: "加里·奥德曼", character: "戈登", job: null, profilePath: null },
      { id: 6384, name: "艾伦·艾克哈特", character: "哈维·登特", job: null, profilePath: null },
    ],
    trailers: [],
    reviews: [],
  },
  {
    id: 13,
    title: "阿甘正传",
    posterPath: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    backdropPath: "/7c9UVPPiTPltouxRVY6N9uugaVA.jpg",
    releaseDate: "1994-06-23",
    voteAverage: 8.5,
    overview: "阿甘以真诚和坚持走过数十年人生，也见证了时代的起伏。",
    genres: ["剧情", "爱情"],
    runtime: 142,
    tagline: "人生就像一盒巧克力。",
    director: "罗伯特·泽米吉斯",
    cast: [
      { id: 31, name: "汤姆·汉克斯", character: "阿甘", job: null, profilePath: null },
      { id: 32, name: "罗宾·怀特", character: "珍妮", job: null, profilePath: null },
      { id: 33, name: "加里·西尼斯", character: "丹中尉", job: null, profilePath: null },
    ],
    trailers: [],
    reviews: [],
  },
  {
    id: 603,
    title: "黑客帝国",
    posterPath: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    backdropPath: "/ncEsesgOJDNrTUED89hYbA117wo.jpg",
    releaseDate: "1999-03-30",
    voteAverage: 8.2,
    overview: "程序员尼奥发现现实世界的真相，并踏上反抗之路。",
    genres: ["科幻", "动作"],
    runtime: 136,
    tagline: "欢迎来到真实世界。",
    director: "莉莉·沃卓斯基 / 拉娜·沃卓斯基",
    cast: [
      { id: 6384, name: "基努·里维斯", character: "尼奥", job: null, profilePath: null },
      { id: 2975, name: "劳伦斯·菲什伯恩", character: "墨菲斯", job: null, profilePath: null },
      { id: 530, name: "凯瑞-安·莫斯", character: "崔妮蒂", job: null, profilePath: null },
    ],
    trailers: [],
    reviews: [],
  },
  {
    id: 497,
    title: "绿里奇迹",
    posterPath: "/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg",
    backdropPath: "/l6hQWH9eDksNJNiXWYRkWqikOdu.jpg",
    releaseDate: "1999-12-10",
    voteAverage: 8.5,
    overview: "监狱死刑区里，一位拥有神秘能力的囚犯改变了所有人。",
    genres: ["剧情", "奇幻", "犯罪"],
    runtime: 189,
    tagline: "奇迹会降临在最黑暗的地方。",
    director: "弗兰克·德拉邦特",
    cast: [
      { id: 31, name: "汤姆·汉克斯", character: "保罗", job: null, profilePath: null },
      { id: 8687, name: "迈克尔·克拉克·邓肯", character: "约翰·考菲", job: null, profilePath: null },
      { id: 4149, name: "大卫·摩斯", character: "布鲁托", job: null, profilePath: null },
    ],
    trailers: [],
    reviews: [],
  },
  {
    id: 238,
    title: "教父",
    posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    backdropPath: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
    releaseDate: "1972-03-14",
    voteAverage: 8.7,
    overview: "黑手党家族在权力、忠诚与传承之间走向命运分岔口。",
    genres: ["剧情", "犯罪"],
    runtime: 175,
    tagline: "我会给他一个无法拒绝的条件。",
    director: "弗朗西斯·福特·科波拉",
    cast: [],
    trailers: [],
    reviews: [],
  },
  {
    id: 680,
    title: "低俗小说",
    posterPath: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg",
    backdropPath: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
    releaseDate: "1994-09-10",
    voteAverage: 8.5,
    overview: "几段交错展开的犯罪故事，拼成一部节奏凌厉的黑色传奇。",
    genres: ["惊悚", "犯罪"],
    runtime: 154,
    tagline: "你得知道地球上有奇迹这回事。",
    director: "昆汀·塔伦蒂诺",
    cast: [],
    trailers: [],
    reviews: [],
  },
  {
    id: 240,
    title: "教父2",
    posterPath: "/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg",
    backdropPath: "/kGzFbGhp99zva6oZODW5atUtnqi.jpg",
    releaseDate: "1974-12-20",
    voteAverage: 8.6,
    overview: "迈克尔继续扩张家族势力，同时回溯维托的崛起往事。",
    genres: ["剧情", "犯罪"],
    runtime: 202,
    tagline: "权力只会让人更孤独。",
    director: "弗朗西斯·福特·科波拉",
    cast: [],
    trailers: [],
    reviews: [],
  },
  {
    id: 424,
    title: "辛德勒的名单",
    posterPath: "/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
    backdropPath: "/zb6fM1CX41D9rF9hdgclu0peUmy.jpg",
    releaseDate: "1993-12-15",
    voteAverage: 8.6,
    overview: "商人辛德勒在战争阴影下尽力拯救犹太工人的生命。",
    genres: ["剧情", "历史", "战争"],
    runtime: 195,
    tagline: "拯救一个人，就是拯救整个世界。",
    director: "史蒂文·斯皮尔伯格",
    cast: [],
    trailers: [],
    reviews: [],
  },
  {
    id: 129,
    title: "千与千寻",
    posterPath: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    backdropPath: "/mnpRKVSXBX6jb56nabvmGKA0Wig.jpg",
    releaseDate: "2001-07-20",
    voteAverage: 8.5,
    overview: "少女误入神灵世界，在成长中寻找名字、勇气与归途。",
    genres: ["动画", "奇幻", "家庭"],
    runtime: 125,
    tagline: "不要回头，一直往前走。",
    director: "宫崎骏",
    cast: [],
    trailers: [],
    reviews: [],
  },
  {
    id: 19404,
    title: "地心引力",
    posterPath: "/kZ2nZw8D681aphje8NJi8EfbL1U.jpg",
    backdropPath: "/rjNoiRiqttA0QsvkA8Vq3xap0HO.jpg",
    releaseDate: "2013-10-03",
    voteAverage: 7.2,
    overview: "两名宇航员在太空灾难后设法重返地球，孤独与求生交织。",
    genres: ["科幻", "惊悚"],
    runtime: 91,
    tagline: "别放手。",
    director: "阿方索·卡隆",
    cast: [],
    trailers: [],
    reviews: [],
  },
];

const FALLBACK_PAGE_SIZE = 6;
const FALLBACK_TARGET_SIZE = 100;

function buildRepeatedFallbackDetails() {
  const repeated: MovieDetail[] = [];
  for (let index = 0; index < FALLBACK_TARGET_SIZE; index += 1) {
    const sourceIndex = index % FALLBACK_MOVIE_DETAILS.length;
    const source = FALLBACK_MOVIE_DETAILS[sourceIndex];
    if (!source) {
      continue;
    }
    const batch = Math.floor(index / FALLBACK_MOVIE_DETAILS.length);
    repeated.push({
      ...source,
      id: source.id + batch * 100000,
      title: batch === 0 ? source.title : `${source.title} ${batch + 1}`,
    });
  }
  return repeated;
}

const FALLBACK_POPULAR_DETAILS = buildRepeatedFallbackDetails();

export function getFallbackPopularMovies(page = 1): PagedResult<MovieSummary> {
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const startIndex = (normalizedPage - 1) * FALLBACK_PAGE_SIZE;
  const pageItems = FALLBACK_POPULAR_DETAILS.slice(
    startIndex,
    startIndex + FALLBACK_PAGE_SIZE,
  );

  return {
    page: normalizedPage,
    totalPages: Math.max(1, Math.ceil(FALLBACK_POPULAR_DETAILS.length / FALLBACK_PAGE_SIZE)),
    totalResults: FALLBACK_POPULAR_DETAILS.length,
    results: pageItems.map((movie) => ({
      id: movie.id,
      title: movie.title,
      posterPath: movie.posterPath,
      backdropPath: movie.backdropPath,
      releaseDate: movie.releaseDate,
      voteAverage: movie.voteAverage,
      overview: movie.overview,
    })),
  };
}

export function getFallbackMovieDetail(movieId: number) {
  return FALLBACK_MOVIE_DETAILS.find((movie) => movie.id === movieId) ?? null;
}
