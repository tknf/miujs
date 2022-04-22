import { render, getCacheControlHeader, CacheMinutes } from "miujs/node";
import { posts } from "../content/posts";

export const get = ({ createContent }) => {
  const html = createContent({
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
  });

  return render(html, {
    status: 200,
    headers: {
      [getCacheControlHeader()]: CacheMinutes()
    }
  });
};

export const post = async ({ request, createContent }) => {
  const formdata = await request.formData();
  const name = formdata.get("name");

  const status = name ? 200 : 400;
  const error = !name ? `Invalid \"name\".` : undefined;

  const html = createContent({
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
      error
    }
  });

  return render(html, {
    status
  });
};
