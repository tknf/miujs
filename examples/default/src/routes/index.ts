import { RouteAction, render } from "miujs/node";
import { posts } from "../content/posts";

export const get: RouteAction = ({ template, context }) => {
  return render(template("index", { posts, theme: context.theme }), { status: 200 });
};

export const post: RouteAction = async ({ request, template }) => {
  const formdata = await request.formData();
  const name = formdata.get("name");

  return render(
    template("index", {
      posts,
      data: {
        name,
        error: !name ? `Invalid "name".` : undefined
      }
    }),
    {
      status: name ? 200 : 400
    }
  );
};
