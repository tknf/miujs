import { RouteAction, render } from "miujs";
import { posts } from "../../content/posts";

export const get: RouteAction = ({ template, params }) => {
  const post = posts.find(({ handle }) => handle === params?.handle);

  let html: string;
  let status: number;

  if (!post || post.handle === "404") {
    status = 404;
    return render(template("404"), { status: 404 });
  } else if (post.handle === "500") {
    return render(template("500"), { status: 500 });
  }
  return render(template("post", { post }), { status: 200 });
};
