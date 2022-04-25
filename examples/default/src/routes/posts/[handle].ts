import { CacheMinutes, getCacheControlHeader, RouteAction, render } from "miujs";
import { posts } from "../../content/posts";

export const get: RouteAction = ({ createContent, params }) => {
  const post = posts.find(({ handle }) => handle === params?.handle);

  let html: string;
  let status: number;

  if (!post || post.handle === "404") {
    status = 404;
    return render(
      createContent({
        layout: "404"
      }),
      { status: 404 }
    );
  } else if (post.handle === "500") {
    return render(
      createContent({
        layout: "500"
      }),
      { status: 500 }
    );
  }
  return render(
    createContent({
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
    }),
    { status: 200 }
  );
};
