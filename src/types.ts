export type RootStackParamList = {
  MainTabs: undefined;
  ArticleWebView: {
    url: string;
    title?: string;
    source?: string;
  };
  ArticleReader: {
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

export type ReaderContent = {
  title: string;
  byline?: string;
  leadImageUrl?: string;
  contentHtml: string;
  textContent?: string;
  source?: string;
  publishedAt?: string;
};

export type DefaultOpenMode = 'Reader' | 'WebView';
