import { useState, useCallback, useEffect, useRef } from "react";

import Post from "./Post";

interface IPost {
  id: number;
  userId: number;
  title: string;
  body: string;
}

const Page = () => {
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (loading) return;
    console.log(loading);
    setLoading(true);
    const res = await fetch(
      `https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=6`
    );
    const data = await res.json();
    setPosts((posts) => [...posts, ...data]);
    setLoading(false);
  }, [loading, page]);

  const scrollListener = useCallback(
    async (e: Event) => {
      const scrollHeight = (e.target as HTMLDivElement).scrollHeight;
      const offsetHeight = (e.target as HTMLDivElement).offsetHeight;
      const scrollTop = (e.target as HTMLDivElement).scrollTop;
      if (Math.floor(scrollHeight - (offsetHeight + scrollTop)) < 150) {
        fetchPosts();
      }
    },
    [fetchPosts]
  );

  useEffect(() => {
    const masterContainer = document.getElementById("__next")!
      .firstElementChild as HTMLDivElement;

    masterContainer.addEventListener("scroll", scrollListener);
    return () => {
      masterContainer.removeEventListener("scroll", scrollListener);
    };
  }, [scrollListener]);

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="h-full flex flex-col items-center b/g-white/10 py-10">
      {posts && posts.map((post) => <Post key={post.id} post={post} />)}
      {loading && <div>Fetching Posts ...</div>}
    </div>
  );
};

export default Page;
