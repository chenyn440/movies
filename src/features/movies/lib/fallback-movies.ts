import type { MovieSummary, PagedResult } from "@/features/movies/types";

const FALLBACK_POPULAR_MOVIES: MovieSummary[] = [
  {
    id: 157336,
    title: "星际穿越",
    posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdropPath: "/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
    releaseDate: "2014-11-05",
    voteAverage: 8.4,
    overview:
      "一组宇航员穿越虫洞，寻找人类未来可居住的新家园。",
  },
  {
    id: 27205,
    title: "盗梦空间",
    posterPath: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdropPath: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    releaseDate: "2010-07-15",
    voteAverage: 8.4,
    overview:
      "擅长潜入梦境的盗贼接受了一个几乎不可能完成的植入想法任务。",
  },
  {
    id: 155,
    title: "黑暗骑士",
    posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdropPath: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
    releaseDate: "2008-07-16",
    voteAverage: 8.5,
    overview:
      "蝙蝠侠在哥谭迎来最危险的对手，小丑掀起全面混乱。",
  },
  {
    id: 13,
    title: "阿甘正传",
    posterPath: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    backdropPath: "/7c9UVPPiTPltouxRVY6N9uugaVA.jpg",
    releaseDate: "1994-06-23",
    voteAverage: 8.5,
    overview:
      "阿甘以真诚和坚持走过数十年人生，也见证了时代的起伏。",
  },
  {
    id: 603,
    title: "黑客帝国",
    posterPath: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    backdropPath: "/ncEsesgOJDNrTUED89hYbA117wo.jpg",
    releaseDate: "1999-03-30",
    voteAverage: 8.2,
    overview:
      "程序员尼奥发现现实世界的真相，并踏上反抗之路。",
  },
  {
    id: 497,
    title: "绿里奇迹",
    posterPath: "/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg",
    backdropPath: "/l6hQWH9eDksNJNiXWYRkWqikOdu.jpg",
    releaseDate: "1999-12-10",
    voteAverage: 8.5,
    overview:
      "监狱死刑区里，一位拥有神秘能力的囚犯改变了所有人。",
  },
];

export function getFallbackPopularMovies(): PagedResult<MovieSummary> {
  return {
    page: 1,
    totalPages: 1,
    totalResults: FALLBACK_POPULAR_MOVIES.length,
    results: FALLBACK_POPULAR_MOVIES,
  };
}
