import { CacheWeeks, render, getCacheControlHeader } from "miujs/node";
import type { RouteAction } from "miujs/node";
import { md } from "../lib/markdown-it";

export const get: RouteAction = ({ createContent, query, request, context, params }) => {
  const navigation = context.markdownContents
    .sort((a, b) => {
      const aIndex: number = a.data.index || 0;
      const bIndex: number = b.data.index || 1;
      return aIndex - bIndex;
    })
    .filter((d) => d.data.published)
    .map((doc) => {
      const url = `/${doc.data.handle || ""}`;
      const requestUrl = new URL(request.url);
      return {
        url,
        text: doc.data.title,
        current: url === requestUrl.pathname
      };
    });

  const contents = context.markdownContents
    .filter((d) => d.data.published)
    .find((c) => c.data.handle === params!.handle);

  if (!contents) {
    return render(createContent({ layout: "404", data: { navigation } }), {
      status: 404
    });
  }

  const raw = md.render(contents?.content || "");
  const html = createContent({
    layout: "default",
    sections: [],
    metadata: {
      title: contents.data.title
    },
    data: {
      navigation,
      prev: contents?.data.prev,
      next: contents?.data.next
    },
    __raw_html: raw
  });

  return render(html, {
    status: 200,
    headers: {
      [getCacheControlHeader()]: CacheWeeks()
    }
  });
};
