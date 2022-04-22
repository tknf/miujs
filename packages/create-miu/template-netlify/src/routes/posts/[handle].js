import { CacheMinutes, getCacheControlHeader, RouteAction, render } from "miujs";
import { posts } from "../../content/posts";

export const get = ({ createContent, params }) => {
  const post = posts.find(({ handle }) => handle === params?.handle);

  let html;
  let status;

  if (!post || post.handle === "404") {
    status = 404;
    html = createContent({
      layout: "404"
    });
  } else if (post.handle === "500") {
    status = 500;
    html = createContent({
      layout: "500"
    });
  } else {
    status = 200;
    html = createContent({
      layout: "default",
      sections: [
        {
          name: "common-header",
          settings: {}
        },
        {
          name: "post-detail",
          settings: {}
        }
      ],
      metadata: {},
      data: {
        post
      }
    });
  }

  return render(html, {
    status
  });
};
