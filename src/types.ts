export type RootStackParamList = {
  MainTabs: undefined;
  ArticleWebView: {
    url: string;
    title?: string;
    source?: string;
  };
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  link: string;
  summary?: string;
  image?: string;
};
