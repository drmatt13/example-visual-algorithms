/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef } from "react";

interface IProps {
  post: {
    id: number;
    userId: number;
    title: string;
    body: string;
  };
}

const Post = ({ post }: IProps) => {
  const postImgRef = useRef<HTMLImageElement>(null);

  const [profileImg, setProfileImg] = useState(
    `https://i.pravatar.cc/50?img=${Math.floor(Math.random() * (70 - 1) + 1)}`
  );

  const [postImg, setPostImg] = useState(
    `https://picsum.photos/id/${Math.floor(
      Math.random() * (1075 - 1) + 1
    )}/650/400`
  );

  useEffect(() => {
    postImgRef.current?.addEventListener("error", () => {
      postImgRef.current?.remove();
    });
  }, []);

  return (
    <>
      <div className="relative bg-slate-300/25 pt-3 rounded-lg mb-4 max-w-[90%] w-[32rem] md:w-[35rem] test-white overflow-hidden">
        <div className="mx-3 flex items-start pb-3 mb-3 border-b border-white/25">
          {profileImg && (
            <img
              className="self-center rounded-full shadow-xl"
              src={profileImg}
              alt="avatar"
            />
          )}
          <div className="flex-1 flex self-center ml-3 font-mono text-sm font-bold ">
            {post.title}
          </div>
        </div>
        <div className="mx-3 pb-3 flex-1 flex self-center">{post.body}</div>
        <div>
          {postImg && <img ref={postImgRef} src={postImg} alt="postImage" />}
        </div>
        <div className="h-10 flex justify-between mx-3 border-b border-white/25">
          <div className="flex items-center">xxx likes</div>
          <div className="flex items-center">
            <div className="pr-3">xxx comments</div>
            <div>xxx shares</div>
          </div>
        </div>
        <div className="h-12 flex justify-evenly mx-3">
          <div className="m-1 flex-1 flex justify-center items-center rounded-md hover:cursor-pointer hover:bg-gray-400/20 transition-colors ease-out">
            Like
          </div>
          <div className="m-1 flex-1 flex justify-center items-center rounded-md hover:cursor-pointer hover:bg-gray-400/20 transition-colors ease-out">
            Comment
          </div>
          <div className="m-1 flex-1 flex justify-center items-center rounded-md hover:cursor-pointer hover:bg-gray-400/20 transition-colors ease-out">
            Share
          </div>
        </div>
      </div>
    </>
  );
};

export default Post;
