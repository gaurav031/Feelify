import { Avatar } from "@chakra-ui/avatar";
import { Image } from "@chakra-ui/image";
import { Box, Flex, Text } from "@chakra-ui/layout";
import { Link, useNavigate } from "react-router-dom";
import Actions from "./Actions";
import { useEffect, useState, useRef } from "react";
import useShowToast from "../hooks/useShowToast";
import { formatDistanceToNow } from "date-fns";
import { DeleteIcon } from "@chakra-ui/icons";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";

const Post = ({ post, postedBy }) => {
  const [user, setUser] = useState(null);
  const showToast = useShowToast();
  const currentUser = useRecoilValue(userAtom);
  const [posts, setPosts] = useRecoilState(postsAtom);
  const navigate = useNavigate();

  const videoRefs = useRef([]); // Ref for all video elements

  useEffect(() => {
    const getUser = async () => {
      try {
        const userIdOrUsername = postedBy?._id || postedBy;
        const res = await fetch("/api/users/profile/" + userIdOrUsername);
        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        setUser(data);
      } catch (error) {
        showToast("Error", error.message, "error");
        setUser(null);
      }
    };
    getUser();
  }, [postedBy, showToast]);

  // Function to handle video playback
  const handleVideoPlayPause = (index) => {
    videoRefs.current.forEach((video, i) => {
      if (i === index) {
        // Play the current video if it's in view
        video.play();
      } else {
        // Pause all other videos
        video.pause();
      }
    });
  };

  // IntersectionObserver to detect when a video enters or leaves the viewport
  useEffect(() => {
    const observers = videoRefs.current.map((video, index) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              handleVideoPlayPause(index);
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.5 } // Trigger when 50% of the video is in view
      );

      observer.observe(video);

      return observer;
    });

    // Cleanup observers on component unmount
    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const handleDeletePost = async (e) => {
    try {
      e.preventDefault();
      if (!window.confirm("Are you sure you want to delete this post?")) return;

      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      showToast("Success", "Post deleted", "success");
      setPosts(posts.filter((p) => p._id !== post._id));
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  if (!user) return null;

  return (
    <Link to={`/${user.username}/post/${post._id}`}>
      <Flex gap={3} mb={4} py={5}>
        <Flex flexDirection={"column"} alignItems={"center"}>
          <Avatar
            size="md"
            name={user.name || "User  "} // Fallback name
            src={user.profilePic || "/default-profile-pic.png"}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/${user.username}`);
            }}
          />
          <Box w="1px" h={"full"} bg="gray.light" my={2}></Box>
          <Box position={"relative"} w={"full"}>
            {post.replies.length === 0 && <Text textAlign={"center"}>🥱</Text>}
            {post.replies.map((reply, index) => (
              <Avatar
                key={index}
                size="xs"
                name={reply.userName || "User "}
                src={reply.userProfilePic}
                position={"absolute"}
                top={index === 0 ? "0px" : index === 1 ? "0px" : "0px"}
                left={index === 0 ? "15px" : index === 1 ? "-5px" : "4px"}
                right={index === 1 ? "-5px" : undefined}
                padding={"2px"}
              />
            ))}
          </Box>
        </Flex>
        <Flex flex={1} flexDirection={"column"} gap={2}>
          <Flex justifyContent={"space-between"} w={"full"}>
            <Flex w={"full"} alignItems={"center"}>
              <Text
                fontSize={"sm"}
                fontWeight={"bold"}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/${user.username}`);
                }}
              >
                {user.username}
              </Text>
              <Image src="/verified.png" w={4} h={4} ml={1} alt="Verified" />
            </Flex>
            <Flex gap={4} alignItems={"center"}>
              <Text fontSize={"xs"} width={36} textAlign={"right"} color={"gray.light"}>
                {formatDistanceToNow(new Date(post.createdAt))} ago
              </Text>

              {currentUser ?._id === post.postedBy._id && (
                <DeleteIcon size={20} onClick={handleDeletePost} cursor="pointer" />
              )}
            </Flex>
          </Flex>

          <Text fontSize={"sm"}>{post.text}</Text>

          {/* Add video rendering logic */}
          {post.video && (
            <Box borderRadius={6} overflow={"hidden"} border={"1px solid"} borderColor={"gray.light"}>
              <video
                ref={(el) => (videoRefs.current[0] = el)} // Assigning ref to the video
                src={post.video}
                autoPlay={false}
                style={{ width: '100%', height: 'auto', borderRadius: '10px' }}
                controls
              />
            </Box>
          )}

          {/* Keep the image rendering logic */}
          {post.img && (
            <Box borderRadius={6} overflow={"hidden"} border={"1px solid"} borderColor={"gray.light"}>
              <Image src={post.img} w={"full"} alt="Post image" />
            </Box>
          )}

          <Flex gap={3} my={1}>
            <Actions post={post} />
          </Flex>
        </Flex>
      </Flex>
    </Link>
  );
};

export default Post;
