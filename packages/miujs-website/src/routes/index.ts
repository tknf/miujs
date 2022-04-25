import { CacheWeeks, render, getCacheControlHeader } from "miujs/node";
import type { RouteAction } from "miujs/node";
import { md } from "../lib/markdown-it";

export const get: RouteAction = ({ createContent, request, context }) => {
  const contents = context.markdownContents.find((c) => c.key === "index");
  const raw = md.render(contents?.content || "");
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

  const html = createContent({
    layout: "default",
    sections: [],
    metadata: {},
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
