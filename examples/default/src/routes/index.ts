import { RouteAction, render, json, getCacheControlHeader, CacheMinutes } from "miujs/node";
import { posts } from "../content/posts";

export const get: RouteAction = ({ createContent }) => {
  return render(
    createContent({
      layout: "default",
      sections: [
        {
          name: "common-header",
          settings: {}
        },
        {
          name: "home-content",
          settings: {}
        }
      ],
      metadata: {},
      data: {
        posts
      }
    }),
    {
      status: 200,
      headers: {
        [getCacheControlHeader()]: CacheMinutes()
      }
    }
  );
};

export const post: RouteAction = async ({ request, createContent }) => {
  const formdata = await request.formData();
  const name = formdata.get("name");

  return render(
    createContent({
      layout: "default",
      sections: [
        {
          name: "common-header",
          settings: {}
        },
        {
          name: "home-content",
          settings: {}
        }
      ],
      metadata: {},
      data: {
        posts,
        name,
        error: !name ? `Invalid \"name\".` : undefined
      }
    }),
    {
      status: name ? 200 : 400
    }
  );
};
